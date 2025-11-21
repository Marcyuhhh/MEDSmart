import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, ScrollView, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { patientStyles } from '../../styles/patient.styles';
import { COLORS } from '../../styles/common.styles';
import Input from '../../components/common/input';
import Button from '../../components/common/button';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useAuth } from '../_layout';

import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';

const DAYS_OF_WEEK = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];

const MedicationConfigForm = ({ compartment, onClose, onSave }) => {
  const [medName, setMedName] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState([]);
  const [time, setTime] = useState(null);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);

  useEffect(() => {
    if (compartment && compartment.medName) {
      setMedName(compartment.medName);
      setDescription(compartment.description || '');
      setDays(compartment.days || []);
      setTime(compartment.time || null);
    } else {
      setMedName('');
      setDescription('');
      setDays([]);
      setTime(null);
    }
  }, [compartment]);

  const toggleDay = (day) => {
    setDays((prevDays) =>
      prevDays.includes(day)
        ? prevDays.filter((d) => d !== day)
        : [...prevDays, day]
    );
  };

  const handleConfirmTime = (selectedTime) => {
    const formattedTime = selectedTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    setTime(formattedTime);
    setTimePickerVisible(false);
  };

  const handleSave = () => {
    if (!medName || days.length === 0 || !time) {
      Alert.alert('Missing Info', 'Please set a name, at least one day, and a time.');
      return;
    }
    const scheduleData = {
      medName,
      description,
      days,
      time,
      isEmpty: false,
    };
    onSave(compartment.id, scheduleData);
  };

  return (
    <ScrollView>
      <Text style={patientStyles.modalTitle}>
        Configure {compartment?.id}
      </Text>
      
      <Input placeholder="Medication Name" value={medName} onChangeText={setMedName} />
      <Input placeholder="Description (e.g., 'Take with food')" value={description} onChangeText={setDescription} />

      <Text style={{...patientStyles.modalTitle, fontSize: 16, marginBottom: 10}}>Select Days</Text>
      <View style={patientStyles.dayToggleContainer}>
        {DAYS_OF_WEEK.map((day, index) => {
          const isSelected = days.includes(day);
          return (
            <TouchableOpacity
              key={index}
              style={[
                patientStyles.dayToggle,
                isSelected && patientStyles.dayToggleSelected,
              ]}
              onPress={() => toggleDay(day)}
            >
              <Text style={[
                patientStyles.dayToggleText,
                isSelected && patientStyles.dayToggleTextSelected
              ]}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Button
        title={time ? `Time: ${time}` : 'Set Time'}
        onPress={() => setTimePickerVisible(true)}
        color={COLORS.lightGray}
        textColor={COLORS.black}
      />

      <View style={patientStyles.modalButtonContainer}>
        <View style={patientStyles.modalButton}>
          <Button title="Cancel" onPress={onClose} color={COLORS.gray} />
        </View>
        <View style={patientStyles.modalButton}>
          <Button title="Save" onPress={handleSave} color={COLORS.patientPrimary} />
        </View>
      </View>

      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        onConfirm={handleConfirmTime}
        onCancel={() => setTimePickerVisible(false)}
      />
    </ScrollView>
  );
};

const GridLegend = () => (
  <View style={patientStyles.legendContainer}>
    <View style={patientStyles.legendItem}>
      <View style={[patientStyles.legendColorBox, patientStyles.cellUnset, { borderColor: COLORS.gray }]} />
      <Text style={patientStyles.legendText}>Unset</Text>
    </View>
    <View style={patientStyles.legendItem}>
      <View style={[patientStyles.legendColorBox, patientStyles.cellSetFull]} />
      <Text style={patientStyles.legendText}>Full</Text>
    </View>
    <View style={patientStyles.legendItem}>
      <View style={[patientStyles.legendColorBox, patientStyles.cellSetEmpty]} />
      <Text style={patientStyles.legendText}>Empty</Text>
    </View>
  </View>
);

export default function MedBoxScreen() {
  const { user } = useAuth();
  const [compartments, setCompartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCompartment, setSelectedCompartment] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    console.log("Refreshing MedBox data...");
    setIsRefreshing(true);
    setTimeout(() => {
      console.log("MedBox data refreshed.");
      setIsRefreshing(false);
    }, 1000);
  }, []);

  // Real-time Firebase listener
  useEffect(() => {
    if (!user) return;

    const medBoxRef = doc(db, 'medboxes', user.uid);
    const unsubscribe = onSnapshot(medBoxRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const compartmentsArray = Object.keys(data).map(key => ({ 
          id: key, 
          ...data[key] 
        })).sort((a, b) => a.id.localeCompare(b.id));
        
        setCompartments(compartmentsArray);
        setIsLoading(false);
        setIsRefreshing(false);
      } else {
        console.log("Creating new MedBox for user...");
        const initialData = {};
        const ids = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];
        ids.forEach(id => {
          initialData[id] = {
            medName: null,
            description: null,
            days: [],
            time: null,
            isEmpty: false,
          };
        });
        await setDoc(medBoxRef, initialData);
      }
    }, (error) => {
      console.error("Error fetching MedBox data: ", error);
      Alert.alert("Error", "Failed to load MedBox data.");
      setIsLoading(false);
      setIsRefreshing(false);
    });
    
    return () => unsubscribe();
  }, [user]);

  const handleOpenModal = (compartment) => {
    setSelectedCompartment(compartment);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedCompartment(null);
  };

  // Real Firebase save
  const handleSaveSchedule = async (compartmentId, scheduleData) => {
    try {
      const medboxRef = doc(db, 'medboxes', user.uid);
      
      await updateDoc(medboxRef, {
        [compartmentId]: scheduleData
      });
      
      console.log('Saved to Firebase:', compartmentId);
      handleCloseModal();
    } catch (error) {
      console.error("Error saving schedule:", error);
      Alert.alert("Save Failed", "Please check your internet connection.");
    }
  };

  // Real Firebase simulation
  const onSimulateTakeDose = async () => {
    const firstFullCompartment = compartments.find(c => c.medName && !c.isEmpty);
    if (!firstFullCompartment) {
      Alert.alert("Simulation Failed", "All compartments are already empty or unset.");
      return;
    }
    
    try {
      const medboxRef = doc(db, 'medboxes', user.uid);
      await updateDoc(medboxRef, {
        [`${firstFullCompartment.id}.isEmpty`]: true
      });
      
      Alert.alert("Simulation Success", `Compartment ${firstFullCompartment.id} (${firstFullCompartment.medName}) is now marked as EMPTY.`);
    } catch (error) {
      console.error("Error simulating dose:", error);
      Alert.alert("Simulation Failed", "Could not update database.");
    }
  };

  const renderCompartment = ({ item }) => {
    let style, textStyle, cellContent;
    if (!item.medName) {
      style = patientStyles.cellUnset;
      textStyle = patientStyles.cellTextUnset;
      cellContent = `+ Set ${item.id}`;
    } else if (item.isEmpty) {
      style = patientStyles.cellSetEmpty;
      textStyle = patientStyles.cellText;
      cellContent = `${item.medName}\n(Empty)`;
    } else {
      style = patientStyles.cellSetFull;
      textStyle = patientStyles.cellText;
      cellContent = item.medName;
    }
    
    return (
      <TouchableOpacity
        style={[patientStyles.compartmentCell, style]}
        onPress={() => handleOpenModal(item)}
      >
        <Text style={textStyle}>{cellContent}</Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={patientStyles.gridContainer}>
        <ActivityIndicator size="large" color={COLORS.patientPrimary} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={patientStyles.gridContainer}>
      <FlatList
        data={compartments}
        renderItem={renderCompartment}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={<GridLegend />}
        ListFooterComponent={
          <View style={patientStyles.devButtonContainer}>
            <Button
              title="Simulate Take Medicine (Dev)"
              onPress={onSimulateTakeDose}
              color={COLORS.warning}
              textColor={COLORS.black}
            />
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.patientPrimary]}
          />
        }
      />

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity 
          style={patientStyles.modalBackdrop} 
          activeOpacity={1} 
          onPressOut={handleCloseModal}
        >
          <View style={patientStyles.modalContent} onStartShouldSetResponder={() => true}>
            <MedicationConfigForm
              compartment={selectedCompartment}
              onClose={handleCloseModal}
              onSave={handleSaveSchedule}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}