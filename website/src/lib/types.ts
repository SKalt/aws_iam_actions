export type Action = {
  service: string;
  prefix: string;
  action: string;
  access_level: string;
  table_link: string;
  action_docs_link: string;
  condition_keys: string;
  dependent_actions: string;
};
export type Kind = "service" | "prefix" | "action";
export type SearchResult = {
  name: string;
  kind: Kind;
  prefix: string;
};

export enum AccessLevel {
  Permissions = "Permissions management",
  Write = "Write",
  Tagging = "Tagging",
  List = "List",
  Read = "Read",
  Unknown = "",
}

export const accessTier = (accessLevel: AccessLevel): number => {
  switch (accessLevel) {
    case AccessLevel.Permissions:
      return 5;
    case AccessLevel.Write:
      return 4;
    case AccessLevel.Tagging:
      return 3;
    case AccessLevel.List:
      return 2;
    case AccessLevel.Read:
      return 1;
    case AccessLevel.Unknown:
      return -1;
  }
};

export const asAccessLevel = (str: string): AccessLevel => {
  switch (str) {
    case "Write":
      return AccessLevel.Write;
    case "Permissions management":
      return AccessLevel.Permissions;
    case "Read":
      return AccessLevel.Read;
    case "List":
      return AccessLevel.List;
    case "Tagging":
      return AccessLevel.Tagging;
    default:
      return AccessLevel.Unknown;
  }
};
