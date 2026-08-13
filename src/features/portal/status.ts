export type PortalEmptyReason =
  | "not_linked"
  | "no_children"
  | "no_enrollment"
  | "no_data";

export type PortalDataStatus = PortalEmptyReason | "ok";
export type PortalChildrenStatus = Extract<
  PortalDataStatus,
  "not_linked" | "no_children" | "ok"
>;
