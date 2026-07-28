
export const PERMISSION_MODULES = [
  {
    title: "Users",
    actions: [
      { key: "user.view", label: "View" },
      { key: "user.create", label: "Create" },
      { key: "user.update", label: "Update" },
      { key: "user.delete", label: "Delete" },
      { key: "user.export", label: "Export" },
      { key: "user.import", label: "Import" },
      { key: "user.assign", label: "Assign" },
      { key: "user.approve", label: "Approve" },
    ],
  },

  {
    title: "Roles",
    actions: [
      { key: "role.view", label: "View" },
      { key: "role.create", label: "Create" },
      { key: "role.update", label: "Update" },
      { key: "role.delete", label: "Delete" },
      { key: "role.assign", label: "Assign" },
    ],
  },

  {
    title: "Employees",
    actions: [
      { key: "employee.view", label: "View" },
      { key: "employee.create", label: "Create" },
      { key: "employee.update", label: "Update" },
      { key: "employee.delete", label: "Delete" },
      { key: "employee.export", label: "Export" },
      { key: "employee.import", label: "Import" },
      { key: "employee.approve", label: "Approve" },
    ],
  },

  {
    title: "Leads",
    actions: [
      { key: "lead.view", label: "View" },
      { key: "lead.create", label: "Create" },
      { key: "lead.update", label: "Update" },
      { key: "lead.delete", label: "Delete" },
      { key: "lead.assign", label: "Assign" },
      { key: "lead.convert", label: "Convert" },
      { key: "lead.export", label: "Export" },
    ],
  },

  {
    title: "Customers",
    actions: [
      { key: "customer.view", label: "View" },
      { key: "customer.create", label: "Create" },
      { key: "customer.update", label: "Update" },
      { key: "customer.delete", label: "Delete" },
      { key: "customer.export", label: "Export" },
    ],
  },

  {
    title: "Inventory",
    actions: [
      { key: "inventory.view", label: "View" },
      { key: "inventory.create", label: "Create" },
      { key: "inventory.update", label: "Update" },
      { key: "inventory.delete", label: "Delete" },
      { key: "inventory.stockin", label: "Stock In" },
      { key: "inventory.stockout", label: "Stock Out" },
      { key: "inventory.export", label: "Export" },
    ],
  },

  {
    title: "Purchase Orders",
    actions: [
      { key: "po.view", label: "View" },
      { key: "po.create", label: "Create" },
      { key: "po.update", label: "Update" },
      { key: "po.delete", label: "Delete" },
      { key: "po.approve", label: "Approve" },
      { key: "po.print", label: "Print" },
    ],
  },

  {
    title: "Sales Orders",
    actions: [
      { key: "sales.view", label: "View" },
      { key: "sales.create", label: "Create" },
      { key: "sales.update", label: "Update" },
      { key: "sales.delete", label: "Delete" },
      { key: "sales.assign", label: "Assign" },
      { key: "sales.approve", label: "Approve" },
    ],
  },
];