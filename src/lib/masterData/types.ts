/**
 * Shared shape every Master Data list conforms to.
 * Individual masters (Positions, Employment Types, …) extend this with a
 * typed `awardLogic` payload — but the framework can render/edit any of
 * them through the same MasterListShell.
 */
export type MasterScope = 'system' | 'tenant' | 'location';
export type MasterStatus = 'active' | 'archived';

export interface MasterItem {
  id: string;
  code: string;
  label: string;
  description?: string;
  status: MasterStatus;
  scope: MasterScope;
  /** Seeded system entries — can be renamed but not deleted. */
  isSystemDefault: boolean;
  /** How many records reference this option. Blocks hard-delete when > 0. */
  usageCount?: number;
}

/** Column descriptor for the generic table. */
export interface MasterColumn<T extends MasterItem> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
}
