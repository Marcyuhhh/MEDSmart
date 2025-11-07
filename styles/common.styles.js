import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  patientPrimary: '#1E88E5',
  patientBackground: '#E3F2FD',
  caregiverPrimary: '#43A047',
  caregiverBackground: '#E8F5E8',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9E9E9E',
  lightGray: '#EEEEEE',
  danger: '#D32F2F',
  warning: '#FBC02D',
  success: '#388E3C',
};

export const SIZES = {
  base: 8,
  small: 12,
  medium: 14,
  large: 16,
  xlarge: 18,
  xxlarge: 24,
  h1: 30,
  h2: 26,
  h3: 22,
  width,
  height,
};

export const FONTS = {
  bold: '700',
  semiBold: '600',
  medium: '500',
  regular: '400',
  light: '300',
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: FONTS.bold,
    marginBottom: SIZES.medium,
  },
  text: {
    fontSize: SIZES.large,
    fontWeight: FONTS.regular,
    color: COLORS.black,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
});