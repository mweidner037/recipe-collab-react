import { ReactNode, useEffect, useState } from "react";

import { makeElectricContext } from "electric-sql/react";
import { uniqueTabId } from "electric-sql/util";
import { LIB_VERSION } from "electric-sql/version";
import { ElectricDatabase, electrify } from "electric-sql/wa-sqlite";

import { authToken } from "./auth";
import { Electric, schema } from "./generated/client";

const { ElectricProvider, useElectric } = makeElectricContext<Electric>();

// eslint-disable-next-line react-refresh/only-export-components
export { useElectric };

export const Loader = ({ children }: { children: ReactNode }) => {
  const [electric, setElectric] = useState<Electric>();

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const config = {
        debug: import.meta.env.DEV,
        url: import.meta.env.ELECTRIC_SERVICE,
      };

      const { tabId } = uniqueTabId();
      const scopedDbName = `basic-${LIB_VERSION}-${tabId}.db`;

      const conn = await ElectricDatabase.init(scopedDbName);
      const electric = await electrify(conn, schema, config);
      await electric.connect(authToken());

      if (!isMounted) {
        return;
      }

      setElectric(electric);
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  console.log(electric);
  if (electric === undefined) {
    return null;
  }

  return <ElectricProvider db={electric}>{children}</ElectricProvider>;
};
