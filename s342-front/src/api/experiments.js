import axiosInstance from "./http";

export const ExperimentsAPI = {
  // --- Experiments ---
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
    const res = await axiosInstance.patch(`/experiments/${experimentId}/`, payload);
    return res.data;
  },

  remove: async (experimentId) => {
    const res = await axiosInstance.delete(`/experiments/${experimentId}/`);
    return res.data;
  },

  // --- Run lifecycle ---
  getReadiness: async (experimentId) => {
    const res = await axiosInstance.get(`/experiments/${experimentId}/readiness/`);
    return res.data;
  },

  run: async (experimentId) => {
    const res = await axiosInstance.post(`/experiments/${experimentId}/run/`);
    return res.data;
  },

  // Keep legacy signature (unknown backend shape); add spec-aligned helper too.
  getRun: async (runId) => {
    const res = await axiosInstance.get(`/runs/${runId}/`);
    return res.data;
  },

  getRunForExperiment: async (experimentId, runId) => {
    const res = await axiosInstance.get(`/experiments/${experimentId}/runs/${runId}/`);
    return res.data;
  },

  // --- Buildings (v1 includes aggregated EEM fields inside building) ---
  listBuildings: async (experimentId) => {
    const res = await axiosInstance.get(`/experiments/${experimentId}/buildings/`);
    return res.data.items ?? res.data; // tolerate either {items:[...]} or [...]
  },

  createBuilding: async (experimentId, payload) => {
    const res = await axiosInstance.post(`/experiments/${experimentId}/buildings/`, payload);
    return res.data;
  },

  patchBuilding: async (experimentId, buildingId, payload) => {
    const res = await axiosInstance.patch(
      `/experiments/${experimentId}/buildings/${buildingId}/`,
      payload
    );
    return res.data;
  },

  removeBuilding: async (experimentId, buildingId) => {
    const res = await axiosInstance.delete(
      `/experiments/${experimentId}/buildings/${buildingId}/`
    );
    return res.data;
  },

  // --- Financing schemes: catalog (definitions) ---
  listFinancingSchemeCatalog: async () => {
    const res = await axiosInstance.get("/financing-schemes/");
    return res.data.items ?? res.data;
  },

  getFinancingSchemeDefinition: async (schemeKey) => {
    const res = await axiosInstance.get(`/financing-schemes/${schemeKey}/`);
    return res.data;
  },

  // --- Financing schemes: experiment instances (user selections) ---
  listExperimentFinancingSchemes: async (experimentId) => {
    const res = await axiosInstance.get(`/experiments/${experimentId}/financing-schemes/`);
    return res.data.items ?? res.data;
  },

  addExperimentFinancingScheme: async (experimentId, payload) => {
    const res = await axiosInstance.post(`/experiments/${experimentId}/financing-schemes/`, payload);
    return res.data;
  },

  patchExperimentFinancingScheme: async (experimentId, fsId, payload) => {
    const res = await axiosInstance.patch(
      `/experiments/${experimentId}/financing-schemes/${fsId}/`,
      payload
    );
    return res.data;
  },

  removeExperimentFinancingScheme: async (experimentId, fsId) => {
    const res = await axiosInstance.delete(
      `/experiments/${experimentId}/financing-schemes/${fsId}/`
    );
    return res.data;
  },
};

export default ExperimentsAPI;