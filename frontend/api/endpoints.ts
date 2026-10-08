export class Endpoints {
  static readonly Users = class {
    static readonly register = () => "/users" as const;
    static readonly login    = () => "/users/login" as const;
    static readonly byId     = (id: number | string) => `/users/${id}` as const;
  };

  static readonly Plans = class {
    static readonly list    = () => "/plans" as const;
    static readonly current = () => "/plans/current" as const;
    static readonly byId    = (planId: string) => `/plans/${planId}` as const;

    static readonly transactions = (planId: string) =>
      `/plans/${planId}/transactions` as const;

    static readonly goals = (planId: string) =>
      `/plans/${planId}/goals` as const;

    static readonly categories = (planId: string) =>
      `/plans/${planId}/categories` as const;

    static readonly incomeSources = (planId: string) =>
      `/plans/${planId}/income-sources` as const;
  };

  static readonly Transactions = class {
    static readonly byId = (id: string) => `/transactions/${id}` as const;
  };

  static readonly Goals = class {
    static readonly byId = (id: string) => `/goals/${id}` as const;
  };

  static readonly Categories = class {
    static readonly byId         = (id: string) => `/categories/${id}` as const;
    static readonly subcategories = (id: string) => `/categories/${id}/subcategories` as const;
  };

  static readonly Subcategories = class {
    static readonly byId = (id: string) => `/subcategories/${id}` as const;
  };

  static readonly IncomeSources = class {
    static readonly byId = (id: string) => `/income-sources/${id}` as const;
  };
}
