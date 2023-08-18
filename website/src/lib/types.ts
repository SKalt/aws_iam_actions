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
  link: string | null;
};

export const enum AccessLevel { // directly references level ids in db
  Permissions = 6,
  Write = 5,
  Tagging = 4,
  List = 3,
  Read = 2,
  Unknown = 1,
}

export const enum AccessLevelName {
  Permissions = "Permissions management",
  Write = "Write",
  Tagging = "Tagging",
  List = "List",
  Read = "Read",
  Unknown = "",
}

export const accessTier = (accessLevel: AccessLevelName): number => {
  switch (accessLevel) {
    case AccessLevelName.Permissions:
      return AccessLevel.Permissions;
    case AccessLevelName.Write:
      return AccessLevel.Write;
    case AccessLevelName.Tagging:
      return AccessLevel.Tagging;
    case AccessLevelName.List:
      return AccessLevel.List;
    case AccessLevelName.Read:
      return AccessLevel.Read;
    case AccessLevelName.Unknown:
      return AccessLevel.Unknown;
  }
};
export const defaultAccessLevels = () => ({
  [AccessLevelName.Unknown]: true,
  [AccessLevelName.Read]: true,
  [AccessLevelName.List]: true,
  [AccessLevelName.Write]: true,
  [AccessLevelName.Tagging]: true,
  [AccessLevelName.Permissions]: true,
});

export const getAccessLevels = (
  accessLevel?: string,
): ReturnType<typeof defaultAccessLevels> => {
  const result = defaultAccessLevels();
  const accessLevels = accessLevel || "urlwtp";
  if (!accessLevels.includes("u")) result[AccessLevelName.Unknown] = false;
  if (!accessLevels.includes("r")) result[AccessLevelName.Read] = false;
  if (!accessLevels.includes("l")) result[AccessLevelName.List] = false;
  if (!accessLevels.includes("w")) result[AccessLevelName.Write] = false;
  if (!accessLevels.includes("t")) result[AccessLevelName.Tagging] = false;
  if (!accessLevels.includes("p")) result[AccessLevelName.Permissions] = false;
  return result;
};

export const asAccessLevel = (str: string): AccessLevel => {
  switch (str.toLowerCase().trim()) {
    case "w":
    case "write":
      return AccessLevel.Write;
    case "p":
    case "permissions":
    case "permissions management":
      return AccessLevel.Permissions;
    case "r":
    case "read":
      return AccessLevel.Read;
    case "l":
    case "list":
      return AccessLevel.List;
    case "t":
    case "tagging":
      return AccessLevel.Tagging;
    default:
      return AccessLevel.Unknown;
  }
};
