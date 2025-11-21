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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { caregiverStyles } from '../../styles/caregiver.styles'; // Green Theme
import { COLORS } from '../../styles/common.styles';
import { useAuth } from '../_layout';
import Input from '../../components/common/input';
import Button from '../../components/common/button';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

// --- Constants ---
const DAYS_OF_WEEK = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];

// --- Medication Config Form (Green Version) ---
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
      prevDays.includes(day) ? prevDays.filter((d) => d !== day) : [...prevDays, day]
    );
  };

  const handleConfirmTime = (selectedTime) => {
    const formattedTime = selectedTime.toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit',
    });
    setTime(formattedTime);
    setTimePickerVisible(false);
  };

  const handleSave = () => {
    if (!medName || days.length === 0 || !time) {
      Alert.alert('Missing Info', 'Please set a name, days, and time.');
      return;
    }
    onSave(compartment.id, { medName, description, days, time, isEmpty: false });
  };

  return (
    <ScrollView>
      <Text style={caregiverStyles.modalTitle}>Configure {compartment?.id}</Text>
      
      <Input placeholder="Medication Name" value={medName} onChangeText={setMedName} />
      <Input placeholder="Description" value={description} onChangeText={setDescription} />

      <Text style={{...caregiverStyles.modalTitle, fontSize: 16, marginBottom: 10}}>Select Days</Text>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10}}>
        {DAYS_OF_WEEK.map((day, index) => {
          const isSelected = days.includes(day);
          return (
            <TouchableOpacity
              key={index}
              style={{
                width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
                backgroundColor: isSelected ? COLORS.caregiverPrimary : COLORS.lightGray,
              }}
              onPress={() => toggleDay(day)}
            >
              <Text style={{fontWeight: 'bold', color: isSelected ? COLORS.white : COLORS.black}}>{day}</Text>
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

      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 20}}>
        <View style={{flex: 1, marginRight: 5}}>
            <Button title="Cancel" onPress={onClose} color={COLORS.gray} />
        </View>
        <View style={{flex: 1, marginLeft: 5}}>
            <Button title="Save" onPress={handleSave} color={COLORS.caregiverPrimary} />
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

// --- Legend Component (Green Version) ---
const GridLegend = () => (
  <View style={{
    flexDirection: 'row', justifyContent: 'space-around', padding: 10,
    backgroundColor: COLORS.white, borderRadius: 8, margin: 8, ...caregiverStyles.shadow
  }}>
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <View style={[caregiverStyles.cellUnset, {width: 20, height: 20, marginRight: 5}]} />
      <Text>Unset</Text>
    </View>
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <View style={[caregiverStyles.cellSetFull, {width: 20, height: 20, marginRight: 5, borderRadius: 4}]} />
      <Text>Full</Text>
    </View>
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <View style={[caregiverStyles.cellSetEmpty, {width: 20, height: 20, marginRight: 5, borderRadius: 4}]} />
      <Text>Empty</Text>
    </View>
  </View>
);

// --- Main Caregiver MedBox Screen ---
export default function CaregiverMedBoxScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const isPatientConnected = user?.linkedPatientId ? true : false;

  const [compartments, setCompartments] = useState([
    { id: 'A1', medName: null, isEmpty: false }, { id: 'A2', medName: null, isEmpty: false }, { id: 'A3', medName: null, isEmpty: false },
    { id: 'B1', medName: null, isEmpty: false }, { id: 'B2', medName: null, isEmpty: false }, { id: 'B3', medName: null, isEmpty: false },
    { id: 'C1', medName: null, isEmpty: false }, { id: 'C2', medName: null, isEmpty: false }, { id: 'C3', medName: null, isEmpty: false },
  ]);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCompartment, setSelectedCompartment] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- DATA FETCHING ---
  const fetchData = () => {
    if (!isPatientConnected) return;
    console.log(`Fetching MedBox for patient: ${user.linkedPatientId}`);
    // TODO: Connect to Firebase `medboxes/{user.linkedPatientId}`
  };

  useEffect(() => {
    fetchData();
  }, [isPatientConnected]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [isPatientConnected]);

  // --- HANDLERS ---
  const handleOpenModal = (compartment) => {
    setSelectedCompartment(compartment);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedCompartment(null);
  };

  const handleSaveSchedule = (compartmentId, scheduleData) => {
    // TODO: Save to Firebase `medboxes/{user.linkedPatientId}/{compartmentId}`
    setCompartments(prev =>
      prev.map(c => c.id === compartmentId ? { ...c, ...scheduleData } : c)
    );
    handleCloseModal();
  };

  const renderCompartment = ({ item }) => {
    let style, textStyle, cellContent;
    if (!item.medName) {
      style = caregiverStyles.cellUnset;
      textStyle = caregiverStyles.cellTextUnset;
      cellContent = `+ Set ${item.id}`;
    } else if (item.isEmpty) {
      style = caregiverStyles.cellSetEmpty;
      textStyle = caregiverStyles.cellText;
      cellContent = `${item.medName}\n(Empty)`;
    } else {
      style = caregiverStyles.cellSetFull;
      textStyle = caregiverStyles.cellText;
      cellContent = item.medName;
    }
    return (
      <TouchableOpacity
        style={[caregiverStyles.compartmentCell, style]}
        onPress={() => handleOpenModal(item)}
      >
        <Text style={textStyle}>{cellContent}</Text>
      </TouchableOpacity>
    );
  };

  // --- RENDER: No Patient State ---
  if (!isPatientConnected) {
    return (
      <SafeAreaView style={caregiverStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
          <Ionicons name="medkit-outline" size={80} color={COLORS.gray} />
          <Text style={{ fontSize: 18, color: COLORS.gray, textAlign: 'center', marginTop: 20, marginBottom: 30 }}>
            Link to a patient to configure their MedBox remotely.
          </Text>
          <Button 
            title="Go to Profile to Pair" 
            onPress={() => router.push('/(caregiver)/profile')}
            color={COLORS.caregiverPrimary}
          />
        </View>
      </SafeAreaView>
    );
  }

  // --- RENDER: Connected State ---
  return (
    <SafeAreaView style={caregiverStyles.gridContainer}>
      <View style={caregiverStyles.header}>
        <Text style={caregiverStyles.headerTitle}>{user?.linkedPatientName || 'Patient'}'s MedBox</Text>
      </View>

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
            colors={[COLORS.caregiverPrimary]}
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
          style={caregiverStyles.modalBackdrop} 
          activeOpacity={1} 
          onPressOut={handleCloseModal}
        >
          <View style={caregiverStyles.modalContent} onStartShouldSetResponder={() => true}>
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