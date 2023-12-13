import axios from 'axios';
import axiosRetry from 'axios-retry';

axiosRetry(axios);

const $axios = axios;

export default $axios;
