import { FunctionCallRequest, InventoryItem, CategoryItem } from './types';
import { getToolDescription, isDestructiveTool } from './tools';
import { syncInventoryItem, syncDeleteInventoryItem } from '../../lib/inventorySync';
import { upsertCategory, deleteCategory } from '../../lib/supabaseCategories';

export type DialogResult = {
  confirmed: boolean;
  cancelled: boolean;
};

export type DialogHandler = (
  toolName: string,
  description: string,
  args: Record<string, unknown>,
) => Promise<DialogResult>;

export type ExportHandler = () => void;

export interface FunctionDispatcherContext {
  inventory: InventoryItem[];
  categories: CategoryItem[];
  onExportCSV: ExportHandler;
  openDialog: DialogHandler;
}

export class FunctionDispatcher {
  private context: FunctionDispatcherContext | null = null;

  setContext(context: FunctionDispatcherContext): void {
    this.context = context;
  }

  async dispatch(call: FunctionCallRequest): Promise<unknown> {
    if (!this.context) {
      throw new Error('Contexte non initialisé');
    }

    const { name, args } = call;

    switch (name) {
      case 'searchProduct':
        return this.handleSearchProduct(args);

      case 'updateStock':
        return this.handleUpdateStock(args);

      case 'createProduct':
        return this.handleCreateProduct(args);

      case 'deleteProduct':
        return this.handleDeleteProduct(args);

      case 'createCategory':
        return this.handleCreateCategory(args);

      case 'renameCategory':
        return this.handleRenameCategory(args);

      case 'deleteCategory':
        return this.handleDeleteCategory(args);

      case 'exportCSV':
        return this.handleExportCSV(args);

      case 'getStats':
        return this.handleGetStats();

      case 'getLowStock':
        return this.handleGetLowStock(args);

      default:
        throw new Error(`Outil inconnu: ${name}`);
    }
  }

  private handleSearchProduct(args: Record<string, unknown>): unknown {
    const query = String(args.query ?? '').toLowerCase().trim();
    if (!query || !this.context) {
      return { found: false, message: 'Recherche vide' };
    }

    const results = this.context.inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.barcode.includes(query) ||
        (item.brand?.toLowerCase().includes(query) ?? false) ||
        (item.category?.toLowerCase().includes(query) ?? false),
    );

    if (results.length === 0) {
      return { found: false, message: `Aucun produit trouvé pour "${query}"` };
    }

    const topResults = results.slice(0, 5).map((item) => ({
      name: item.name,
      barcode: item.barcode,
      quantity: item.quantity,
      category: item.category,
      brand: item.brand,
    }));

    return {
      found: true,
      count: results.length,
      products: topResults,
      message:
        results.length > 5
          ? `${results.length} produits trouvés. Voici les 5 premiers.`
          : `${results.length} produit(s) trouvé(s).`,
    };
  }

  private async handleUpdateStock(args: Record<string, unknown>): Promise<unknown> {
    const barcode = String(args.barcode ?? '');
    const quantity = typeof args.quantity === 'number' ? args.quantity : undefined;
    const delta = typeof args.delta === 'number' ? args.delta : undefined;

    if (!barcode || !this.context) {
      throw new Error('Code-barres requis');
    }

    const existingItem = this.context.inventory.find(
      (item) => item.barcode === barcode,
    );

    if (!existingItem) {
      throw new Error(`Produit introuvable: ${barcode}`);
    }

    let newQuantity: number;

    if (delta !== undefined) {
      newQuantity = Math.max(0, existingItem.quantity + delta);
    } else if (quantity !== undefined) {
      newQuantity = Math.max(0, quantity);
    } else {
      throw new Error('Quantité ou delta requis');
    }

    const updatedItem: InventoryItem = {
      ...existingItem,
      quantity: newQuantity,
      lastUpdated: Date.now(),
      lastMovement: newQuantity - existingItem.quantity,
    };

    await syncInventoryItem(updatedItem);

    return {
      success: true,
      product: existingItem.name,
      previousQuantity: existingItem.quantity,
      newQuantity,
      message: `Stock de "${existingItem.name}" mis à jour: ${existingItem.quantity} → ${newQuantity}`,
    };
  }

  private async handleCreateProduct(args: Record<string, unknown>): Promise<unknown> {
    if (!this.context) {
      throw new Error('Contexte non disponible');
    }

    const barcode = String(args.barcode ?? '');
    const name = String(args.name ?? '');
    const quantity = typeof args.quantity === 'number' ? args.quantity : 1;
    const category = args.category ? String(args.category) : undefined;
    const brand = args.brand ? String(args.brand) : undefined;

    if (!barcode || !name) {
      throw new Error('Code-barres et nom requis');
    }

    const existingItem = this.context.inventory.find(
      (item) => item.barcode === barcode,
    );

    if (existingItem) {
      return {
        success: false,
        message: `Le produit "${existingItem.name}" existe déjà avec ce code-barres`,
        product: existingItem.name,
        quantity: existingItem.quantity,
      };
    }

    const newItem: InventoryItem = {
      barcode,
      name,
      quantity,
      category,
      brand,
      lastUpdated: Date.now(),
      lastMovement: quantity,
    };

    await syncInventoryItem(newItem);

    return {
      success: true,
      product: name,
      quantity,
      message: `Produit "${name}" créé avec ${quantity} unité(s)`,
    };
  }

  private async handleDeleteProduct(args: Record<string, unknown>): Promise<unknown> {
    if (!this.context) {
      throw new Error('Contexte non disponible');
    }

    const barcode = String(args.barcode ?? '');
    const confirm = args.confirm === true;

    if (!confirm) {
      return {
        success: false,
        requiresConfirmation: true,
        message: 'Cette action nécessite une confirmation',
      };
    }

    const existingItem = this.context.inventory.find(
      (item) => item.barcode === barcode,
    );

    if (!existingItem) {
      throw new Error(`Produit introuvable: ${barcode}`);
    }

    await syncDeleteInventoryItem(barcode);

    return {
      success: true,
      product: existingItem.name,
      message: `Produit "${existingItem.name}" supprimé`,
    };
  }

  private async handleCreateCategory(args: Record<string, unknown>): Promise<unknown> {
    if (!this.context) {
      throw new Error('Contexte non disponible');
    }

    const name = String(args.name ?? '').trim();
    const icon = args.icon ? String(args.icon) : undefined;

    if (!name) {
      throw new Error('Nom de catégorie requis');
    }

    const existingCategory = this.context.categories.find(
      (cat) => cat.name.toLowerCase() === name.toLowerCase(),
    );

    if (existingCategory) {
      return {
        success: false,
        message: `La catégorie "${name}" existe déjà`,
      };
    }

    await upsertCategory({ name, icon });

    return {
      success: true,
      category: name,
      message: `Catégorie "${name}" créée`,
    };
  }

  private async handleRenameCategory(args: Record<string, unknown>): Promise<unknown> {
    if (!this.context) {
      throw new Error('Contexte non disponible');
    }

    const oldName = String(args.oldName ?? '').trim();
    const newName = String(args.newName ?? '').trim();

    if (!oldName || !newName) {
      throw new Error('Ancien et nouveau nom requis');
    }

    const existingCategory = this.context.categories.find(
      (cat) => cat.name.toLowerCase() === oldName.toLowerCase(),
    );

    if (!existingCategory) {
      throw new Error(`Catégorie "${oldName}" introuvable`);
    }

    await upsertCategory({
      id: existingCategory.id,
      name: newName,
      icon: existingCategory.icon,
    });

    const productsInCategory = this.context.inventory.filter(
      (item) => item.category?.toLowerCase() === oldName.toLowerCase(),
    );

    for (const item of productsInCategory) {
      await syncInventoryItem({
        ...item,
        category: newName,
        lastUpdated: Date.now(),
      });
    }

    return {
      success: true,
      oldName,
      newName,
      productsUpdated: productsInCategory.length,
      message: `Catégorie "${oldName}" renommée en "${newName}". ${productsInCategory.length} produit(s) mis à jour.`,
    };
  }

  private async handleDeleteCategory(args: Record<string, unknown>): Promise<unknown> {
    if (!this.context) {
      throw new Error('Contexte non disponible');
    }

    const name = String(args.name ?? '').trim();

    if (!name) {
      throw new Error('Nom de catégorie requis');
    }

    const existingCategory = this.context.categories.find(
      (cat) => cat.name.toLowerCase() === name.toLowerCase(),
    );

    if (!existingCategory || !existingCategory.id) {
      throw new Error(`Catégorie "${name}" introuvable`);
    }

    await deleteCategory(existingCategory.id);

    return {
      success: true,
      category: name,
      message: `Catégorie "${name}" supprimée`,
    };
  }

  private handleExportCSV(args: Record<string, unknown>): unknown {
    if (!this.context) {
      throw new Error('Contexte non disponible');
    }

    this.context.onExportCSV();

    return {
      success: true,
      message: 'Export CSV lancé',
    };
  }

  private handleGetStats(): unknown {
    if (!this.context) {
      throw new Error('Contexte non disponible');
    }

    const totalItems = this.context.inventory.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    const lowStockItems = this.context.inventory.filter(
      (item) => item.quantity <= 5 && item.quantity > 0,
    );

    const outOfStockItems = this.context.inventory.filter(
      (item) => item.quantity === 0,
    );

    const totalPurchaseValue = this.context.inventory.reduce(
      (sum, item) => sum + (item.purchasePrice ?? 0) * item.quantity,
      0,
    );

    const totalSalesValue = this.context.inventory.reduce(
      (sum, item) => sum + (item.salesPrice ?? 0) * item.quantity,
      0,
    );

    return {
      totalReferences: this.context.inventory.length,
      totalUnits: totalItems,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      categoriesCount: this.context.categories.length,
      totalPurchaseValue: totalPurchaseValue.toFixed(2),
      totalSalesValue: totalSalesValue.toFixed(2),
      potentialMargin: (totalSalesValue - totalPurchaseValue).toFixed(2),
    };
  }

  private handleGetLowStock(args: Record<string, unknown>): unknown {
    if (!this.context) {
      throw new Error('Contexte non disponible');
    }

    const limit = typeof args.limit === 'number' ? args.limit : 10;

    const lowStockItems = this.context.inventory
      .filter((item) => item.quantity <= 5)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, limit)
      .map((item) => ({
        name: item.name,
        barcode: item.barcode,
        quantity: item.quantity,
        category: item.category,
      }));

    return {
      count: lowStockItems.length,
      products: lowStockItems,
      message:
        lowStockItems.length > 0
          ? `${lowStockItems.length} produit(s) en stock faible`
          : 'Aucun produit en stock faible',
    };
  }

  async confirmAndExecute(
    call: FunctionCallRequest,
    dialogHandler: DialogHandler,
  ): Promise<unknown> {
    const description = getToolDescription(call.name) ?? 'Action inconnue';
    const destructive = isDestructiveTool(call.name);

    if (destructive) {
      const result = await dialogHandler(call.name, description, call.args);
      if (result.cancelled) {
        return { cancelled: true, message: 'Action annulée par l\'utilisateur' };
      }
      if (!result.confirmed) {
        return { refused: true, message: 'Action refusée' };
      }
    }

    return this.dispatch(call);
  }
}
