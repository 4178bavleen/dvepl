export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    profile: '/auth/profile',
  },

  organization: {
    companies: {
      list: '/company/read/',
      create: '/company/create/',
      update: (id: string) => `/company/update/${id}`,
      remove: (id: string) => `/company/delete/${id}`
    },

    branches: {
      list: '/branch/',
      create: '/branch/create/',
      update: (id: string) => `/branch/${id}`,
      remove: (id: string) => `/branch/${id}`,
    },

    departments: {
      list: '/department/',
      create: '/department/create/',
      update: (id: string) => `/department/update/${id}`,
      remove: (id: string) => `/department/${id}`
    },

    teams: {
      list: '/team/read/',
      create: '/team/create/',
      update: (id: string) => `/team/update/${id}`,
      remove: (id: string) => `/team/delete/${id}`
    }
    ,
    designations: {
      list: '/designation/read/',
      create: '/designation/create/',
      update: (id: string) => `/designation/update/${id}`,
      remove: (id: string) => `/designation/delete/${id}`
    },

    costCenters: {
      list: '/cost-center/read/',
      create: '/cost-center/create/',
      update: (id: string) => `/cost-center/update/${id}`,
      remove: (id: string) => `/cost-center/delete/${id}`
    },
  },
  hrms: {
    employees: {
      list: '/employee/read/',
      create: '/employee/create/',
      update: (id: string) => `/employee/update/${id}`,
      remove: (id: string) => `/employee/delete/${id}`
    },

    attendance: {
      list: '/attendance/read/',
      statuses: '/attendance/read/statuses',
      create: '/attendance/create/',
      update: (id: string) => `/attendance/update/${id}`,
      remove: (id: string) => `/attendance/delete/${id}`
    },

    leave: {
      list: '/leave/read/',
      create: '/leave/create/',
      update: (id: string) => `/leave/update/${id}`,
      remove: (id: string) => `/leave/delete/${id}`
    },

    salary: {
      list: '/salary/read/',
      create: '/salary/create/',
      update: (id: string) => `/salary/update/${id}`,
      remove: (id: string) => `/salary/delete/${id}`
    },

    holidays: {
      list: '/holiday/read/',
      create: '/holiday/create/',
      update: (id: string) => `/holiday/update/${id}`,
      remove: (id: string) => `/holiday/delete/${id}`
    },

    shifts: {
      list: '/shift/read/',
      create: '/shift/create/',
      update: (id: string) => `/shift/update/${id}`,
      remove: (id: string) => `/shift/delete/${id}`
    },

  },
  crm: {
    customers: {
      list: '/customer/read/',
      create: '/customer/create/',
      update: (id: string) => `/customer/update/${id}`,
      remove: (id: string) => `/customer/delete/${id}`
    },

    contacts: {
      list: '/contact/read/',
      create: '/contact/create/',
      update: (id: string) => `/contact/update/${id}`,
      remove: (id: string) => `/contact/delete/${id}`
    },

    communications: {
      list: '/communication/read/',
      create: '/communication/create/',
      remove: (id: string) => `/communication/delete/${id}`
    },
  },
  tender: {
    requests: {
      list: '/tender-request/read/',
      create: '/tender-request/create/',
      update: (id: string) => `/tender-request/update/${id}`,
      remove: (id: string) => `/tender-request/delete/${id}`
    },

    tenders: {
      list: '/tender/read/',
      create: '/tender/create/',
      update: (id: string) => `/tender/update/${id}`,
      remove: (id: string) => `/tender/delete/${id}`
    },

    governmentDepartments: {
      list: '/government-department/read/',
      create: '/government-department/create/',
      update: (id: string) => `/government-department/update/${id}`,
      remove: (id: string) => `/government-department/delete/${id}`
    },

    sections: {
      list: '/section/read/',
      create: '/section/create/',
      update: (id: string) => `/section/update/${id}`,
      remove: (id: string) => `/section/delete/${id}`
    },

    divisions: {
      list: '/division/read/',
      create: '/division/create/',
      update: (id: string) => `/division/update/${id}`,
      remove: (id: string) => `/division/delete/${id}`
    },

    subDivisions: {
      list: '/sub-division/read/',
      create: '/sub-division/create/',
      update: (id: string) => `/sub-division/update/${id}`,
      remove: (id: string) => `/sub-division/delete/${id}`
    },

    referenceCodes: {
      list: '/reference-code/read/',
      regenerate: (tenderId: string) => `/reference-code/regenerate/${tenderId}`
    },

    technicalClarifications: {
      list: '/technical-clarification/read/',
      create: '/technical-clarification/create',
      update: (id: string) => `/technical-clarification/update/${id}`,
      remove: (id: string) => `/technical-clarification/delete/${id}`
    },
  },
  quotation: {
    quotations: {
      list: '/quotation/read/',
      create: '/quotation/create/',
      update: (id: string) => `/quotation/update/${id}`,
      remove: (id: string) => `/quotation/delete/${id}`,
      submit: (id: string) => `/quotation/action/${id}/submit`,
      send: (id: string) => `/quotation/action/${id}/send`,
      respond: (id: string) => `/quotation/action/${id}/respond`,
      revise: (id: string) => `/quotation/action/${id}/revise`,
    },
    items: {
      list: '/quotation-item/read/',
      create: '/quotation-item/create/',
      update: (id: string) => `/quotation-item/update/${id}`,
      remove: (id: string) => `/quotation-item/delete/${id}`,
    },
    approvals: {
      list: '/quotation-approval/read/',
      create: '/quotation-approval/create/',
      update: (id: string) => `/quotation-approval/update/${id}`,
      remove: (id: string) => `/quotation-approval/delete/${id}`,
    },
    activities: {
      list: '/quotation-activity/read/',
      create: '/quotation-activity/create/',
      remove: (id: string) => `/quotation-activity/delete/${id}`,
    },
  },
  salesOrder: {
    salesOrders: {
      list: '/sales-order/read/',
      create: '/sales-order/create/',
      update: (id: string) => `/sales-order/update/${id}`,
      remove: (id: string) => `/sales-order/delete/${id}`,
    },
  },
  approvalRule: {
    approvalRules: {
      list: '/approval-rule/read/',
      create: '/approval-rule/create/',
      update: (id: string) => `/approval-rule/update/${id}`,
      remove: (id: string) => `/approval-rule/delete/${id}`,
    },
  },
  security: {
    users: {
      list: '/user/read/',
      create: '/user/create/',
      update: (id: string) => `/user/update/${id}`,
      remove: (id: string) => `/user/delete/${id}`,
    },
    roles: {
      list: '/role/read/',
      create: '/role/create/',
      update: (id: string) => `/role/update/${id}`,
      remove: (id: string) => `/role/delete/${id}`,
    },
    permissions: {
      list: '/permission/read/',
    },
    permissionGroups: {
      list: '/permission-group/read/',
      create: '/permission-group/create/',
      update: (id: string) => `/permission-group/update/${id}`,
      remove: (id: string) => `/permission-group/delete/${id}`,
    },
  },
} as const;
