import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider } from './I18nProvider';
import { useI18n } from './I18nContext';
import { DeviceSettingsSection } from '../components/settings/DeviceSettingsSection';
import { resetDevicePreferences, reloadDevicePreferences, useDevicePreferencesStore } from '../store/useDevicePreferencesStore';

function Content() {
  const { t } = useI18n();
  return <><p>{t('workspace.noSessionHelp')}</p><DeviceSettingsSection /></>;
}
describe('language settings', () => {
  beforeEach(() => { localStorage.clear(); resetDevicePreferences(); });
  it('switches Japanese, English, Spanish immediately and persists without touching existing settings', () => {
    localStorage.setItem('f1_ai_engineer_config', 'keep-provider');
    const first = render(<I18nProvider><Content /></I18nProvider>);
    fireEvent.change(screen.getByRole('combobox', {name: 'Interface Language'}), {target:{value:'ja'}});
    expect(screen.getByText('ゲームで走行を記録するか、保存したセッションを選択してください。')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', {name: 'AI Response Language'}), {target:{value:'en'}});
    expect(useDevicePreferencesStore.getState().aiResponseLanguage).toBe('en');
    first.unmount();
    reloadDevicePreferences();
    const second = render(<I18nProvider><Content /></I18nProvider>);
    expect(document.documentElement.lang).toBe('ja');
    expect(screen.getByRole('combobox', {name:'AI Response Language'})).toHaveValue('en');
    fireEvent.change(screen.getByRole('combobox', {name:'Interface Language'}), {target:{value:'en'}});
    expect(screen.getByText('Record a session in the game or choose a saved recording.')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', {name:'Interface Language'}), {target:{value:'es'}});
    expect(screen.getByText('Registrá una sesión en el juego o elegí una guardada.')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', {name:'Idioma de la interfaz'}), {target:{value:'ja'}});
    expect(document.documentElement.lang).toBe('ja');
    expect(localStorage.getItem('f1_telemetry_language')).toBe('ja');
    expect(localStorage.getItem('f1_ai_engineer_config')).toBe('keep-provider');
    second.unmount();
  });
});
