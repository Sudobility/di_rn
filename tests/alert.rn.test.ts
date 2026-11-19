import { describe, it, expect, beforeEach, vi } from 'vitest';

// The platform dialog: mocked so no `react-native` is loaded, and so the
// arguments the service hands the native alert can be asserted.
const mockNativeAlert = vi.fn();
vi.mock('../src/alert/platformAlert', () => ({
  nativeAlert: {
    alert: (...args: unknown[]) => mockNativeAlert(...args),
  },
}));

// The DI registry, which `initializeAlertService` also registers with.
const mockInitializeDiAlertService = vi.fn();
vi.mock('@sudobility/di/interfaces', () => ({
  initializeAlertService: (...args: unknown[]) =>
    mockInitializeDiAlertService(...args),
}));

const {
  RNAlertService,
  createRNAlertService,
  initializeAlertService,
  getAlertService,
  resetAlertService,
} = await import('../src/alert/alert.rn.js');

describe('RNAlertService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes the title, message and buttons to the native alert', () => {
    const onPress = vi.fn();
    const buttons = [
      { text: 'Cancel', style: 'cancel' as const },
      { text: 'Delete', style: 'destructive' as const, onPress },
    ];

    new RNAlertService().alert('Title', 'Message', buttons);

    expect(mockNativeAlert).toHaveBeenCalledTimes(1);
    expect(mockNativeAlert).toHaveBeenCalledWith('Title', 'Message', buttons);
  });

  it('shows the default dismiss button when buttons are omitted', () => {
    new RNAlertService().alert('Title', 'Message');

    expect(mockNativeAlert).toHaveBeenCalledWith('Title', 'Message', undefined);
  });

  it('shows the default dismiss button for null message and buttons', () => {
    new RNAlertService().alert('Title', null, null);

    expect(mockNativeAlert).toHaveBeenCalledWith('Title', undefined, undefined);
  });

  // The web service (di_web) shows a single "OK" for an empty array; passed
  // through, React Native's Android alert would have no button to dismiss it.
  it('shows the default dismiss button for an empty buttons array', () => {
    new RNAlertService().alert('Title', 'Message', []);

    expect(mockNativeAlert).toHaveBeenCalledWith('Title', 'Message', undefined);
  });
});

describe('alert service singleton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAlertService();
  });

  it('creates a service', () => {
    expect(createRNAlertService()).toBeInstanceOf(RNAlertService);
  });

  it('throws before it is initialized', () => {
    expect(() => getAlertService()).toThrow(
      'Alert service not initialized. Call initializeAlertService() at app startup.'
    );
  });

  it('initializes once and registers with @sudobility/di', () => {
    const service = new RNAlertService();
    initializeAlertService(service);
    initializeAlertService(new RNAlertService());

    expect(getAlertService()).toBe(service);
    expect(mockInitializeDiAlertService).toHaveBeenCalledTimes(1);
    expect(mockInitializeDiAlertService).toHaveBeenCalledWith(service);
  });
});
