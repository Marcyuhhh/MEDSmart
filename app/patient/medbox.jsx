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
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { patientStyles } from '../../styles/patient.styles';
import { COLORS } from '../../styles/common.styles';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useAuth } from '../_layout';

// Components
import Input from '../../components/common/input';
import Button from '../../components/common/button';

// Services
import { 
  subscribeToMedbox, 
  saveCompartment, 
  deleteCompartment 
} from '../../services/medboxService';

const DAYS_OF_WEEK = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];

// --- Medication Form Component ---
const MedicationConfigForm = ({ compartment, onClose, onSave, onDelete }) => {
  const [medName, setMedName] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState([]);
  const [time, setTime] = useState(null);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);

  // Check if we are editing an existing med (to show Delete button)
  const isEditing = compartment && compartment.medName;

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

  const handleDelete = () => {
    Alert.alert(
      "Delete Medication",
      `Are you sure you want to remove ${medName} from this compartment?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => onDelete(compartment.id) 
        }
      ]
    );
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

      {/* Show Delete Button ONLY if editing */}
      {isEditing && (
        <TouchableOpacity 
          style={{ marginTop: 15, padding: 10, alignItems: 'center' }}
          onPress={handleDelete}
        >
          <Text style={{ color: COLORS.danger, fontWeight: 'bold', fontSize: 16 }}>
            Remove Medication
          </Text>
        </TouchableOpacity>
      )}

      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        onConfirm={handleConfirmTime}
        onCancel={() => setTimePickerVisible(false)}
      />
    </ScrollView>
  );
};

// --- Legend Component ---
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

// --- Main Screen ---
export default function MedBoxScreen() {
  const { user } = useAuth();
  const [compartments, setCompartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCompartment, setSelectedCompartment] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, []);

  // --- SERVICE SUBSCRIPTION ---
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = subscribeToMedbox(
      user.uid,
      (data) => {
        setCompartments(data);
        setIsLoading(false);
      },
      (error) => {
        console.error("MedBox Listener Error:", error);
        setIsLoading(false);
      }
    );

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

  // --- SAVE ---
  const handleSaveSchedule = async (compartmentId, scheduleData) => {
    try {
      await saveCompartment(
        user.uid, 
        user.deviceId, // Pass device ID
        compartmentId, 
        scheduleData
      );
      console.log('Saved via Service');
      handleCloseModal();
    } catch (error) {
      Alert.alert("Save Failed", "Check internet connection.");
    }
  };

  // --- DELETE ---
  const handleDeleteSchedule = async (compartmentId) => {
    try {
      await deleteCompartment(user.uid, user.deviceId, compartmentId);
      Alert.alert("Success", "Medication removed.");
      handleCloseModal();
    } catch (error) {
      console.error("Error deleting:", error);
      Alert.alert("Delete Failed", "Could not remove medication.");
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
              onDelete={handleDeleteSchedule}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}