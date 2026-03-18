import axios from 'axios';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);
mockedAxios.isAxiosError = jest.requireActual('axios').isAxiosError;

export default mockedAxios;
