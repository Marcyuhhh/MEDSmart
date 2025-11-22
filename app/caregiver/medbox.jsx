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
} from 'react-native'; // Standard React Native imports
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

// --- LOCAL IMPORTS ---
import { caregiverStyles } from '../../styles/caregiver.styles'; 
import { COLORS } from '../../styles/common.styles';
import { useAuth } from '../_layout';
import Input from '../../components/common/input';
import Button from '../../components/common/button';

// --- FIREBASE / SERVICE IMPORTS ---
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { subscribeToMedbox, saveCompartment, deleteCompartment } from '../../services/medboxService';

// --- Constants ---
const DAYS_OF_WEEK = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];

// --- Medication Config Form (Green Version - Full Control) ---
const MedicationConfigForm = ({ compartment, onClose, onSave, onDelete }) => {
  const [medName, setMedName] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState([]);
  const [time, setTime] = useState(null);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const isEditing = compartment && compartment.medName;

  useEffect(() => {
    if (compartment && compartment.medName) {
      setMedName(compartment.medName);
      setDescription(compartment.description || '');
      setDays(compartment.days || []);
      setTime(compartment.time || null);
    } else {
      setMedName(''); setDescription(''); setDays([]); setTime(null);
    }
  }, [compartment]);

  const toggleDay = (day) => {
    setDays((prevDays) => prevDays.includes(day) ? prevDays.filter((d) => d !== day) : [...prevDays, day]);
  };

  const handleConfirmTime = (selectedTime) => {
    const formattedTime = selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'});
    setTime(formattedTime); setTimePickerVisible(false);
  };

  const handleSave = () => {
    if (!medName || days.length === 0 || !time) {
      Alert.alert('Missing Info', 'Please set a name, days, and time.');
      return;
    }
    onSave(compartment.id, { medName, description, days, time, isEmpty: false });
  };

  const handleDeletePress = () => {
    Alert.alert("Delete Medication", `Are you sure you want to remove ${medName}?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDelete(compartment.id) }
    ]);
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

      <Button title={time ? `Time: ${time}` : 'Set Time'} onPress={() => setTimePickerVisible(true)} color={COLORS.lightGray} textColor={COLORS.black} />

      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 20}}>
        <View style={{flex: 1, marginRight: 5}}><Button title="Cancel" onPress={onClose} color={COLORS.gray} /></View>
        <View style={{flex: 1, marginLeft: 5}}><Button title="Save" onPress={handleSave} color={COLORS.caregiverPrimary} /></View>
      </View>
      
      {isEditing && (
        <TouchableOpacity style={{ marginTop: 15, padding: 10, alignItems: 'center' }} onPress={handleDeletePress}>
          <Text style={{ color: COLORS.danger, fontWeight: 'bold', fontSize: 16 }}>Remove Medication</Text>
        </TouchableOpacity>
      )}

      <DateTimePickerModal isVisible={isTimePickerVisible} mode="time" onConfirm={handleConfirmTime} onCancel={() => setTimePickerVisible(false)} />
    </ScrollView>
  );
};

// --- Legend Component (Unchanged) ---
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

// --- MAIN COMPONENT ---
export default function CaregiverMedBoxScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const isPatientConnected = user?.linkedPatientId ? true : false;

  const [compartments, setCompartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCompartment, setSelectedCompartment] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [linkedDeviceId, setLinkedDeviceId] = useState(null);
  const [patientName, setPatientName] = useState(user?.linkedPatientName || 'Patient');

  // --- FETCH PATIENT DEVICE ID AND NAME (once) ---
  const fetchPatientInfo = async () => {
    if (!isPatientConnected) return;

    const patientDoc = await getDoc(doc(db, 'users', user.linkedPatientId));
    if (patientDoc.exists()) {
        const pData = patientDoc.data();
        setLinkedDeviceId(pData.deviceId);
        setPatientName(pData.name);
    }
  };


  // --- REAL-TIME DATA LISTENER (Patient's MedBox) ---
  useEffect(() => {
    if (!isPatientConnected) {
        setIsLoading(false);
        setCompartments([]);
        return;
    }
    
    // Fetch info once to get the Device ID
    fetchPatientInfo();

    // Subscribe to patient's medbox data using their UID
    const unsubscribe = subscribeToMedbox(
        user.linkedPatientId, 
        (data) => {
            setCompartments(data);
            setIsLoading(false);
        },
        (error) => {
            console.error("Caregiver MedBox Listener Error:", error);
            setIsLoading(false);
        }
    );

    return () => unsubscribe();
  }, [isPatientConnected]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPatientInfo(); // Refresh patient name/device info
    // The main data updates via the live listener
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

  // Saves changes to the patient's medbox
  const handleSaveSchedule = async (compartmentId, scheduleData) => {
    if (!linkedDeviceId || linkedDeviceId === 'Not Connected' || !isPatientConnected) {
        Alert.alert("Error", "Cannot save: Device ID is unknown or patient is unlinked.");
        return;
    }
    try {
        // Use patient's UID and Device ID
        await saveCompartment(user.linkedPatientId, linkedDeviceId, compartmentId, scheduleData);
        handleCloseModal();
        Alert.alert("Success", "Schedule updated for the patient.");
    } catch (e) {
        Alert.alert("Error", "Failed to save schedule.");
    }
  };

  // Deletes medication from the patient's medbox
  const handleDeleteSchedule = async (compartmentId) => {
    if (!linkedDeviceId || linkedDeviceId === 'Not Connected' || !isPatientConnected) return;
    try {
        await deleteCompartment(user.linkedPatientId, linkedDeviceId, compartmentId);
        handleCloseModal();
        Alert.alert("Success", "Medication deleted.");
    } catch (e) {
        Alert.alert("Error", "Failed to delete medication.");
    }
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
            onPress={() => router.push('/caregiver/profile')}
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
        <Text style={caregiverStyles.headerTitle}>{patientName}'s MedBox</Text>
        {linkedDeviceId && linkedDeviceId !== 'Not Connected' && (
            <Text style={caregiverStyles.headerSubtitle}>Device ID: {linkedDeviceId}</Text>
        )}
      </View>
      
      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.caregiverPrimary} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={compartments}
          renderItem={renderCompartment}
          keyExtractor={(item) => item.id}
          numColumns={3}
          ListHeaderComponent={<GridLegend />}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.caregiverPrimary]} />}
        />
      )}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity style={caregiverStyles.modalBackdrop} activeOpacity={1} onPressOut={handleCloseModal}>
          <View style={caregiverStyles.modalContent} onStartShouldSetResponder={() => true}>
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