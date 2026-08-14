import { Prisma } from "@prisma/client";

interface SyncDynamicInventoryParams {
  prisma: any;
  recordId: string;
  moduleId: string;
  values: Record<string, any>;
  companyId: string;
  userId: string;
}

/**
 * Normalize a key so that different Excel header styles
 * can be compared safely.
 *
 * Examples:
 *
 * "Cost Price (INR)" -> "costpriceinr"
 * "Current Stock"    -> "currentstock"
 * "Product Name"     -> "productname"
 * "SKU"              -> "sku"
 */
function normalizeKey(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Safely read a value from an imported Excel row.
 *
 * Priority:
 *
 * 1. DynamicField fieldName
 * 2. DynamicField label
 * 3. Normalized fieldName
 * 4. Normalized label
 * 5. Known aliases
 */
function getFieldValue(
  values: Record<string, any>,
  field: any | undefined,
  aliases: string[] = [],
): any {
  if (!field) {
    return getAliasValue(values, aliases);
  }

  // Exact fieldName
  if (
    field.fieldName &&
    Object.prototype.hasOwnProperty.call(values, field.fieldName)
  ) {
    return values[field.fieldName];
  }

  // Exact label
  if (
    field.label &&
    Object.prototype.hasOwnProperty.call(values, field.label)
  ) {
    return values[field.label];
  }

  // Normalized fieldName / label
  const normalizedValues = new Map<string, any>();

  for (const [key, value] of Object.entries(values)) {
    normalizedValues.set(normalizeKey(key), value);
  }

  const normalizedFieldName = normalizeKey(field.fieldName);
  const normalizedLabel = normalizeKey(field.label);

  if (normalizedValues.has(normalizedFieldName)) {
    return normalizedValues.get(normalizedFieldName);
  }

  if (normalizedValues.has(normalizedLabel)) {
    return normalizedValues.get(normalizedLabel);
  }

  // Finally check aliases
  return getAliasValue(values, aliases);
}

/**
 * Find a value using aliases from the Excel file.
 */
function getAliasValue(
  values: Record<string, any>,
  aliases: string[],
): any {
  const normalizedValues = new Map<string, any>();

  for (const [key, value] of Object.entries(values)) {
    normalizedValues.set(normalizeKey(key), value);
  }

  for (const alias of aliases) {
    const normalizedAlias = normalizeKey(alias);

    if (normalizedValues.has(normalizedAlias)) {
      return normalizedValues.get(normalizedAlias);
    }
  }

  return null;
}

/**
 * Find the first DynamicField matching a list of keywords.
 */
function findField(
  fields: any[],
  keywords: string[],
): any | undefined {
  return fields.find((field: any) => {
    const fieldName = normalizeKey(field.fieldName);
    const label = normalizeKey(field.label);

    return keywords.some((keyword) => {
      const normalizedKeyword = normalizeKey(keyword);

      return (
        fieldName.includes(normalizedKeyword) ||
        label.includes(normalizedKeyword)
      );
    });
  });
}

/**
 * Convert any value into a number safely.
 */
function toNumber(value: any): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/[₹$€£]/g, "")
    .trim();

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : 0;
}

export async function syncDynamicInventory({
  prisma,
  recordId,
  moduleId,
  values,
  companyId,
  userId,
}: SyncDynamicInventoryParams) {
  // --------------------------------------------------
  // Get Dynamic Fields
  // --------------------------------------------------

  const fields = await prisma.dynamicField.findMany({
    where: {
      moduleId,
    },
  });

  // --------------------------------------------------
  // NAME
  // --------------------------------------------------

  const nameField = findField(fields, [
    "name",
    "product name",
    "material name",
    "item name",
    "description",
    "product",
    "material",
    "item",
  ]);

  const nameValue = getFieldValue(values, nameField, [
    "Product Name",
    "Material Name",
    "Item Name",
    "Name",
    "Description",
    "Product",
    "Material",
    "Item",
  ]);

  const name = String(
    nameValue ||
      Object.values(values).find(
        (value) =>
          typeof value === "string" && value.trim().length > 0,
      ) ||
      "Unnamed Item",
  ).trim();

  // --------------------------------------------------
  // MATERIAL CODE
  // --------------------------------------------------

  const codeField = findField(fields, [
    "material code",
    "materialcode",
    "sku",
    "product id",
    "product code",
    "item code",
    "part number",
    "part no",
    "code",
  ]);

  const codeValue = getFieldValue(values, codeField, [
    "Material Code",
    "MaterialCode",
    "SKU",
    "Product ID",
    "Product Code",
    "Item Code",
    "Part Number",
    "Part No",
    "Code",
  ]);

  const materialCode =
    String(codeValue ?? "").trim() ||
    `MAT-${recordId.substring(0, 8)}`;

  // --------------------------------------------------
  // UNIT
  // --------------------------------------------------

  const unitField = findField(fields, [
    "unit",
    "uom",
    "unit of measure",
    "measurement unit",
  ]);

  const unitValue = getFieldValue(values, unitField, [
    "Unit",
    "UOM",
    "Unit of Measure",
    "Measurement Unit",
  ]);

  const unit = String(unitValue || "Nos").trim();

  // --------------------------------------------------
  // QUANTITY / STOCK
  // --------------------------------------------------

  const quantityField = findField(fields, [
    "quantity",
    "qty",
    "current stock",
    "stock",
    "available stock",
    "opening stock",
    "opening quantity",
    "on hand",
    "stock quantity",
  ]);

  const quantityValue = getFieldValue(values, quantityField, [
    "Quantity",
    "Qty",
    "Current Stock",
    "Stock",
    "Available Stock",
    "Opening Stock",
    "Opening Quantity",
    "On Hand",
    "Stock Quantity",
  ]);

  const quantity = toNumber(quantityValue);

  // --------------------------------------------------
  // PRICE
  // --------------------------------------------------

  const priceField = findField(fields, [
    "unit price",
    "price",
    "rate",
    "cost price",
    "purchase price",
    "buying price",
    "selling price",
  ]);

  const unitPriceValue = getFieldValue(values, priceField, [
    "Unit Price",
    "Price",
    "Rate",
    "Cost Price",
    "Cost Price (INR)",
    "Purchase Price",
    "Buying Price",
  ]);

  const unitPrice = toNumber(unitPriceValue);

  // --------------------------------------------------
  // CATEGORY
  // --------------------------------------------------

  const categoryField = findField(fields, [
    "category",
    "group",
    "product category",
    "material category",
    "item category",
    "type",
  ]);

  const categoryValue = getFieldValue(values, categoryField, [
    "Category",
    "Group",
    "Product Category",
    "Material Category",
    "Item Category",
  ]);

  const category = String(categoryValue || "General").trim();

  // --------------------------------------------------
  // GST
  // --------------------------------------------------

  const gstField = findField(fields, [
    "gst",
    "gst rate",
    "tax",
    "tax rate",
  ]);

  const gstValue = getFieldValue(values, gstField, [
    "GST",
    "GST Rate",
    "Tax",
    "Tax Rate",
  ]);

  const gst = toNumber(gstValue) || 18;

  // --------------------------------------------------
  // MATERIAL
  // --------------------------------------------------

  // `materialCode` is globally unique. Import rows always get a fresh
  // record id, so resolve any material that already owns this code first,
  // otherwise re-importing a code would violate the unique constraint.
  const existingMaterial = await prisma.material.findFirst({
    where: {
      OR: [{ id: recordId }, { materialCode }],
    },
  });

  const materialId = existingMaterial?.id ?? recordId;

  await prisma.material.upsert({
    where: {
      id: materialId,
    },

    create: {
      id: recordId,
      companyId,
      name,
      materialCode,
      unit,
      gst: new Prisma.Decimal(gst),
      category,
      createdById: userId,
    },

    update: {
      name,
      materialCode,
      unit,
      gst: new Prisma.Decimal(gst),
      category,
    },
  });

  // --------------------------------------------------
  // INVENTORY
  // --------------------------------------------------

  await prisma.inventory.upsert({
    where: {
      id: recordId,
    },

    create: {
      id: recordId,
      companyId,
      materialId,
      quantity: new Prisma.Decimal(quantity),
      unitPrice: new Prisma.Decimal(unitPrice),
    },

    update: {
      materialId,
      quantity: new Prisma.Decimal(quantity),
      unitPrice: new Prisma.Decimal(unitPrice),
    },
  });

  // --------------------------------------------------
  // LINK DYNAMIC RECORD → INVENTORY
  // --------------------------------------------------

  await prisma.dynamicRecord.update({
    where: {
      id: recordId,
    },

    data: {
      inventoryId: recordId,
    },
  });

  return {
    recordId,
    materialCode,
    name,
    unit,
    quantity,
    unitPrice,
    category,
    gst,
  };
}

