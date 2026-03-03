import axiosInstance from "./http";

export const ExperimentsAPI = {
  list: async () => {
    const res = await axiosInstance.get("/experiments/");
    return res.data.items;
  },

  get: async (experimentId) => {
    const res = await axiosInstance.get(`/experiments/${experimentId}/`);
    return res.data;
  },

  create: async (payload = {}) => {
    const res = await axiosInstance.post("/experiments/", payload);
    return res.data;
  },

  patch: async (experimentId, payload) => {
    const res = await axiosInstance.patch(
      `/experiments/${experimentId}/`,
      payload
    );
    return res.data;
  },

  remove: async (experimentId) => {
    const res = await axiosInstance.delete(`/experiments/${experimentId}/`);
    return res.data;
  },

  run: async (experimentId) => {
    const res = await axiosInstance.post(`/experiments/${experimentId}/run/`);
    return res.data;
  },

  getRun: async (runId) => {
    const res = await axiosInstance.get(`/runs/${runId}/`);
    return res.data;
  },

  financingSchemes: async () => {
    const res = await axiosInstance.get("/financing-schemes/");
    return res.data;
  },
};

export default ExperimentsAPI;