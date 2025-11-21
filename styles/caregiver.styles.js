import { StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS, commonStyles } from './common.styles';

export const caregiverStyles = StyleSheet.create({
  // --- Containers ---
  container: {
    flex: 1,
    backgroundColor: COLORS.caregiverBackground,
  },
  listContainer: {
    paddingHorizontal: SIZES.large,
    paddingBottom: SIZES.xxlarge,
  },
  
  // --- Dashboard Header ---
  header: {
    padding: SIZES.large,
    paddingTop: SIZES.xlarge,
    backgroundColor: COLORS.caregiverBackground,
  },
  headerTitle: {
    fontSize: SIZES.h2,
    fontWeight: FONTS.bold,
    color: COLORS.black,
  },
  headerSubtitle: {
    fontSize: SIZES.large,
    color: COLORS.gray,
    marginBottom: SIZES.medium,
  },
  patientCard: {
    ...commonStyles.shadow,
    backgroundColor: COLORS.white,
    padding: SIZES.medium,
    borderRadius: SIZES.medium,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.medium,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.caregiverPrimary,
  },
  patientAvatar: { 
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.caregiverPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.medium,
  },
  patientAvatarText: {
    color: COLORS.white,
    fontSize: SIZES.xlarge,
    fontWeight: FONTS.bold,
  },
  patientName: {
    fontSize: SIZES.large,
    fontWeight: FONTS.bold,
    color: COLORS.black,
  },
  patientStatus: {
    fontSize: SIZES.medium,
    color: COLORS.gray,
  },

  // --- Section Titles ---
  sectionTitle: {
    fontSize: SIZES.xlarge,
    fontWeight: FONTS.semiBold,
    color: COLORS.black,
    marginTop: SIZES.xlarge,
    marginBottom: SIZES.medium,
  },

  // --- Status Card ---
  statusCard: {
    ...commonStyles.shadow,
    backgroundColor: COLORS.white,
    padding: SIZES.medium,
    borderRadius: SIZES.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusText: {
    fontSize: SIZES.large,
    fontWeight: FONTS.semiBold,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: SIZES.small,
  },
  statusOnline: { backgroundColor: COLORS.success },
  statusOffline: { backgroundColor: COLORS.danger },

  // --- Upcoming Dose Card ---
  upcomingCard: {
    ...commonStyles.shadow,
    backgroundColor: COLORS.caregiverPrimary, // Green background
    borderRadius: SIZES.medium,
    padding: SIZES.large,
    marginTop: SIZES.medium,
  },
  upcomingTime: {
    fontSize: SIZES.h1,
    fontWeight: FONTS.bold,
    color: COLORS.white,
  },
  upcomingMedName: {
    fontSize: SIZES.xlarge,
    fontWeight: FONTS.semiBold,
    color: COLORS.white,
  },
  upcomingDose: {
    fontSize: SIZES.large,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: SIZES.base,
  },

  // --- Activity & List Items ---
  activityListContainer: {
    padding: SIZES.large,
  },
  activityItem: {
    ...commonStyles.shadow,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.base,
    padding: SIZES.medium,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.medium,
  },
  activityIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.medium,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityTitle: {
    fontSize: SIZES.large,
    fontWeight: FONTS.semiBold,
    color: COLORS.black,
  },
  activityMessage: {
    fontSize: SIZES.medium,
    color: COLORS.gray,
  },
  activityTimestamp: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    position: 'absolute',
    top: SIZES.small,
    right: SIZES.small,
  },
  
  // --- Activity Colors ---
  activitySuccess: { backgroundColor: COLORS.success },
  activityWarning: { backgroundColor: COLORS.warning },
  activityAlert: { backgroundColor: COLORS.danger },

  // --- MedBox Grid (Reused structure, different colors) ---
  gridContainer: {
    flex: 1,
    padding: SIZES.small,
    backgroundColor: COLORS.caregiverBackground,
  },
  compartmentCell: {
    flex: 1,
    margin: SIZES.base,
    aspectRatio: 1,
    borderRadius: SIZES.medium,
    justifyContent: 'center',
    alignItems: 'center',
    ...commonStyles.shadow,
  },
  cellUnset: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.gray,
  },
  cellSetFull: {
    backgroundColor: COLORS.caregiverPrimary, // Green for full
  },
  cellSetEmpty: {
    backgroundColor: COLORS.danger,
  },
  cellText: {
    fontSize: SIZES.medium,
    fontWeight: FONTS.semiBold,
    color: COLORS.white,
    textAlign: 'center',
  },
  cellTextUnset: {
    color: COLORS.gray,
  },

  // --- Profile Styles ---
  profileHeader: {
    padding: SIZES.large,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    paddingTop: SIZES.xlarge,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.caregiverPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.medium,
  },
  profileAvatarText: {
    fontSize: SIZES.h1,
    color: COLORS.white,
    fontWeight: FONTS.bold,
  },
  profileName: {
    fontSize: SIZES.h3,
    fontWeight: FONTS.bold,
    color: COLORS.black,
  },
  profileEmail: {
    fontSize: SIZES.large,
    color: COLORS.gray,
    marginTop: SIZES.base / 2,
  },
  profileRoleBadge: {
    marginTop: SIZES.medium,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.medium,
    borderRadius: SIZES.large,
    backgroundColor: COLORS.caregiverPrimary,
    ...commonStyles.shadow,
  },
  profileRoleBadgeText: {
    color: COLORS.white,
    fontSize: SIZES.small,
    fontWeight: FONTS.bold,
    textTransform: 'uppercase',
  },
  profileSection: {
    marginTop: SIZES.medium,
  },
  profileSectionTitle: {
    fontSize: SIZES.large,
    fontWeight: FONTS.bold,
    color: COLORS.gray,
    paddingHorizontal: SIZES.large,
    marginBottom: SIZES.base,
  },
  profileRow: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.medium,
    paddingHorizontal: SIZES.large,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  profileRowLabel: {
    fontSize: SIZES.large,
    color: COLORS.black,
  },
  profileRowValue: {
    fontSize: SIZES.large,
    color: COLORS.gray,
  },
  
  // --- Modals ---
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.medium,
    borderTopRightRadius: SIZES.medium,
    padding: SIZES.large,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: SIZES.h3,
    fontWeight: FONTS.bold,
    color: COLORS.black,
    marginBottom: SIZES.medium,
  },
});