# Manufacturing ERP - Phase 1 (MVP)

## Objective

The goal of Phase 1 is to deliver the complete business workflow from
Tender to Inventory while keeping the implementation simple, stable, and
production-ready. Advanced features such as approvals, revisions,
workflow engines, and extensive audit/history tracking will be
implemented in later phases.

------------------------------------------------------------------------

# Module Flow

``` text
Technical Clarification
        ↓
BOQ
        ↓
Quotation
        ↓
Sales Order
        ↓
Engineering
        ↓
BOM
        ↓
Material Master
        ↓
Purchase
        ↓
Inventory
```

------------------------------------------------------------------------

# Modules Included

## 1. Technical Clarification

### Models

-   TechnicalClarification

### Purpose

-   Raise technical queries
-   Track customer responses
-   Maintain clarification status before quotation

------------------------------------------------------------------------

## 2. BOQ

### Models

-   BOQ
-   BOQItem

### Purpose

-   Import customer BOQ
-   Store all BOQ line items
-   Maintain quantities and specifications

------------------------------------------------------------------------

## 3. Quotation Management

### Models

-   Quotation
-   QuotationItem

### Purpose

-   Generate quotation from BOQ
-   Calculate pricing
-   Send quotation to customer

------------------------------------------------------------------------

## 4. Sales Order

### Models

-   SalesOrder

### Purpose

-   Create sales order after quotation approval
-   Start execution process

------------------------------------------------------------------------

## 5. Engineering

### Models

-   EngineeringProject
-   EngineeringDrawing

### Purpose

-   Create engineering project
-   Upload drawings
-   Prepare production documents

------------------------------------------------------------------------

## 6. Bill of Materials (BOM)

### Models

-   BOM
-   BOMAssembly
-   BOMItem

### Purpose

-   Define assemblies
-   Define required materials
-   Generate production BOM

------------------------------------------------------------------------

## 7. Material Master

### Models

-   Material

### Purpose

-   Store raw materials
-   Store finished goods
-   Standardize material information

------------------------------------------------------------------------

## 8. Purchase

### Models

-   PurchaseRequest
-   PurchaseOrder

### Purpose

-   Create purchase requests
-   Generate purchase orders for required materials

------------------------------------------------------------------------

## 9. Inventory

### Models

-   Inventory

### Purpose

-   Track available stock
-   Update stock after purchases
-   Consume stock during production

------------------------------------------------------------------------

# Excluded from Phase 1

The following features are intentionally postponed to later phases:

-   Approval Engine
-   Revision Management
-   Attachment Management
-   Activity Logs
-   Cost Estimation Module
-   Vendor Management
-   Production Planning
-   Quality Control
-   Dispatch
-   Finance
-   Reports & Dashboards

------------------------------------------------------------------------

# Phase 1 Deliverables

-   Technical clarification workflow
-   BOQ management
-   Quotation generation
-   Sales order creation
-   Engineering project management
-   BOM creation
-   Material master
-   Purchase workflow
-   Inventory management

------------------------------------------------------------------------

# Future Phases

## Phase 2

-   Approval Engine
-   BOQ Revisions
-   Drawing Revisions
-   Attachments
-   Vendor Management
-   Cost Estimation

## Phase 3

-   Production
-   Quality Control
-   Dispatch
-   Finance
-   Reports & Dashboards

------------------------------------------------------------------------

This document represents the MVP scope and should be validated with the
client before development begins. Additional enterprise features can be
enabled in later phases based on budget, timeline, and business
requirements.
