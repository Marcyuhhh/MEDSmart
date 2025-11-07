import { StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from './common.styles';

export const patientStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: SIZES.xxlarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    marginTop: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  connectedCard: {
    borderLeftWidth: 6,
    borderLeftColor: COLORS.success,
  },
  disconnectedCard: {
    borderLeftWidth: 6,
    borderLeftColor: COLORS.warning,
  },
  highlightCard: {
    backgroundColor: '#E3F2FD', // Light blue background
    borderLeftWidth: 6,
    borderLeftColor: COLORS.primary,
  },
  smallCard: {
    padding: 16,
  },
  cardTitle: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  medicationName: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  medicationTime: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    marginBottom: 4,
  },
  medicationDetail: {
    fontSize: SIZES.small,
    color: '#666',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
});