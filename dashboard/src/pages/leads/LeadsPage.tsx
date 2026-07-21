import React from "react";
import { GenericCrudPage } from "@/components/shared/GenericCrudPage";
import { leadsConfig } from "@/constants/configs";

export function LeadsPage() {
  return <GenericCrudPage {...leadsConfig} />;
}

export default LeadsPage;