import { Outlet } from 'react-router-dom';

function SettingsIndex() {
  return (
    <div>
      <p>Settings</p>
      <Outlet />
    </div>
  );
}

export default SettingsIndex;
