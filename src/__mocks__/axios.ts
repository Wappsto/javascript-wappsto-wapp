const mockedAxios: any = jest.createMockFromModule('axios')
mockedAxios.create = jest.fn(() => mockedAxios)
export default mockedAxios