import axios from 'axios';
import { showAlert } from './alert';

export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'http://localhost:8000/api/v1/users/updatePassword'
        : 'http://localhost:8000/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'erfolgreiches Update') {
      showAlert('success', `${type.toUpperCase()} Erfolgreich upgedated`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
