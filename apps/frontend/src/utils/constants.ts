export const V1_API_BASE = "/api/v1" as const;

export const paths = {
  home: "/",
  settings: "/settings",
  backgroundContent: {
    list: "/background-content",
    add: "/background-content/add",
    edit: "/background-content/edit/*",
  },
  channels: {
    list: "/channels",
    add: "/channels/add",
    edit: "/channels/edit/*",
  },
} as const;
