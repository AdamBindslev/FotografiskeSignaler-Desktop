/**
 * ModuleRegistry.ts - Central modulregistrering og dynamisk indlæsning (§10.4, §10.5)
 */

export interface ModuleInstance {
  mount(container: HTMLElement): void | Promise<void>;
  onActivate?(context?: any): void;
  onDeactivate?(): void;
  destroy?(): void;
}

export interface AppModule {
  id: string;
  name: string;
  shortName: string;
  description: string;
  iconSvg: string;
  accentColor: string;
  route: string;
  aliases?: string[];
  loader: () => Promise<ModuleInstance>;
}

export class ModuleRegistry {
  private static modules: Map<string, AppModule> = new Map();
  private static instances: Map<string, ModuleInstance> = new Map();

  public static register(module: AppModule): void {
    this.modules.set(module.id, module);
  }

  public static get(id: string): AppModule | undefined {
    return this.modules.get(id);
  }

  public static getAll(): AppModule[] {
    return Array.from(this.modules.values());
  }

  public static getByRoute(route: string): AppModule | undefined {
    const cleanRoute = route.split('?')[0].replace(/^#\/?/, '').toLowerCase();
    for (const mod of this.modules.values()) {
      const modRoute = mod.route.replace(/^#\/?/, '').toLowerCase();
      if (modRoute === cleanRoute || (cleanRoute === '' && mod.id === 'home')) {
        return mod;
      }
      if (mod.aliases) {
        for (const alias of mod.aliases) {
          if (alias.replace(/^#\/?/, '').toLowerCase() === cleanRoute) {
            return mod;
          }
        }
      }
    }
    return this.modules.get('home');
  }

  public static async loadInstance(id: string): Promise<ModuleInstance> {
    if (this.instances.has(id)) {
      return this.instances.get(id)!;
    }
    const def = this.modules.get(id);
    if (!def) {
      throw new Error(`Modul med id "${id}" er ikke registreret`);
    }
    const instance = await def.loader();
    this.instances.set(id, instance);
    return instance;
  }
}
