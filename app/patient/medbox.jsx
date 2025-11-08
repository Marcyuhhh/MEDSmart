import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { patientStyles } from '../../styles/patient.styles';
import { COLORS } from '../../styles/common.styles';
import Input from '../../components/common/input';
import Button from '../../components/common/button';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

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
  const [compartments, setCompartments] = useState([
    { id: 'A1', medName: null, isEmpty: false }, { id: 'A2', medName: null, isEmpty: false }, { id: 'A3', medName: null, isEmpty: false },
    { id: 'B1', medName: null, isEmpty: false }, { id: 'B2', medName: null, isEmpty: false }, { id: 'B3', medName: null, isEmpty: false },
    { id: 'C1', medName: null, isEmpty: false }, { id: 'C2', medName: null, isEmpty: false }, { id: 'C3', medName: null, isEmpty: false },
  ]);
  
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

  useEffect(() => {
    // TODO: Connect to Firebase
  }, []);

  const handleOpenModal = (compartment) => {
    setSelectedCompartment(compartment);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedCompartment(null);
  };

  const handleSaveSchedule = (compartmentId, scheduleData) => {
    setCompartments(prev =>
      prev.map(c => 
        c.id === compartmentId ? { ...c, ...scheduleData } : c
      )
    );
    console.log('Saving to', compartmentId, scheduleData);
    handleCloseModal();
  };
  
  const onSimulateTakeDose = () => {
    const firstFullCompartment = compartments.find(c => c.medName && !c.isEmpty);
    if (!firstFullCompartment) {
      Alert.alert("Simulation Failed", "All compartments are already empty or unset.");
      return;
    }
    setCompartments(prev =>
      prev.map(c =>
        c.id === firstFullCompartment.id ? { ...c, isEmpty: true } : c
      )
    );
    Alert.alert("Simulation Success", `Compartment ${firstFullCompartment.id} (${firstFullCompartment.medName}) is now marked as EMPTY (red).`);
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