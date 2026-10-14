# Architecture rules

- Employee schedule clock records are distinct from rostered shifts and filtered through `employeeSchedule`; actual attendance must not inflate scheduled hours or offer roster-only actions.
- Employee portal sample attendance is labelled and used only when no employee timesheets exist; it must not be presented as saved staff data.
- Scheduling rule categories share the existing constraint editor and category-specific context; presentation must distinguish contract templates from independent roster-wide checks because their configurations are not synchronised.