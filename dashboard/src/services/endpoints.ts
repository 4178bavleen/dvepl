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
  },
} as const;
