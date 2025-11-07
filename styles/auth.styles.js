import { StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from './common.styles';

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: SIZES.xxlarge,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: SIZES.xxlarge + 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: COLORS.patientPrimary,
  },
  instructionText: {
    fontSize: SIZES.large,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SIZES.large,
  },
  forgotPasswordContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: SIZES.medium,
  },
  forgotPasswordText: {
    color: COLORS.patientPrimary,
    fontSize: SIZES.medium,
    fontWeight: FONTS.semiBold,
  },
  link: {
    marginTop: SIZES.medium,
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: SIZES.large,
  },
  linkBold: {
    fontWeight: FONTS.bold,
    color: COLORS.patientPrimary,
  },
  devBypassContainer: {
    marginTop: SIZES.xlarge,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: SIZES.medium,
  },
  roleCard: {
    backgroundColor: COLORS.white,
    padding: SIZES.xxlarge,
    borderRadius: 12,
    marginVertical: SIZES.small,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardSelected: {
    borderColor: COLORS.patientPrimary,
    backgroundColor: COLORS.patientBackground,
  },
  roleTitle: {
    fontSize: SIZES.xlarge,
    fontWeight: FONTS.semiBold,
    marginBottom: SIZES.base,
  },
  roleDescription: {
    fontSize: SIZES.medium,
    textAlign: 'center',
    lineHeight: 22,
    color: COLORS.gray,
  },
  dropdownButton: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginVertical: 10,
    justifyContent: 'center',
  },
  dropdownButtonText: {
    fontSize: SIZES.large,
    color: COLORS.black,
  },
  dropdownPlaceholder: {
    fontSize: SIZES.large,
    color: '#999',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SIZES.width * 0.8,
    backgroundColor: COLORS.white,
    padding: SIZES.large,
    borderRadius: 12,
    maxHeight: SIZES.height * 0.6,
  },
  modalTitle: {
    fontSize: SIZES.xlarge,
    fontWeight: FONTS.bold,
    marginBottom: SIZES.medium,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: SIZES.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalOptionText: {
    fontSize: SIZES.large,
    textAlign: 'center',
  },
});