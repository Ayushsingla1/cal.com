// eslint-disable-next-line no-restricted-imports
import { noop } from "lodash";
import { useEffect } from "react";
import { useIntercom as useIntercomLib } from "react-use-intercom";
import { z } from "zod";

import dayjs from "@calcom/dayjs";
import { WEBAPP_URL, WEBSITE_URL } from "@calcom/lib/constants";
import { useHasTeamPlan, useHasPaidPlan } from "@calcom/lib/hooks/useHasPaidPlan";
import { localStorage } from "@calcom/lib/webstorage";
import { trpc } from "@calcom/trpc/react";

// eslint-disable-next-line turbo/no-undeclared-env-vars
export const isInterComEnabled = z.string().min(1).safeParse(process.env.NEXT_PUBLIC_INTERCOM_APP_ID).success;

const useIntercomHook = isInterComEnabled
  ? useIntercomLib
  : () => {
      return {
        boot: noop,
        show: noop,
        shutdown: noop,
      };
    };

export const useIntercom = () => {
  const hookData = useIntercomHook();
  const { data } = trpc.viewer.me.get.useQuery();
  const { data: statsData } = trpc.viewer.me.myStats.useQuery(undefined, {
    trpc: {
      context: {
        skipBatch: true,
      },
    },
  });
  const { hasPaidPlan } = useHasPaidPlan();
  const { hasTeamPlan } = useHasTeamPlan();

  const boot = async () => {
    if (!data || !statsData) return;
    let userHash;

    const req = await fetch(`/api/intercom-hash`);
    const res = await req.json();
    if (res?.hash) {
      userHash = res.hash;
    }

    hookData.boot({
      ...(data && data?.name && { name: data.name }),
      ...(data && data?.email && { email: data.email }),
      ...(data && data?.id && { userId: data.id }),
      createdAt: String(dayjs(data?.createdDate).unix()),
      ...(userHash && { userHash }),
      customAttributes: {
        //keys should be snake cased
        user_name: data?.username,
        link: `${WEBSITE_URL}/${data?.username}`,
        admin_link: `${WEBAPP_URL}/settings/admin/users/${data?.id}/edit`,
        impersonate_user: `${WEBAPP_URL}/settings/admin/impersonation?username=${
          data?.email ?? data?.username
        }`,
        identity_provider: data?.identityProvider,
        timezone: data?.timeZone,
        locale: data?.locale,
        has_paid_plan: hasPaidPlan,
        has_team_plan: hasTeamPlan,
        metadata: data?.metadata,
        completed_onboarding: data.completedOnboarding,
        is_logged_in: !!data,
        sum_of_bookings: statsData?.sumOfBookings,
        sum_of_calendars: statsData?.sumOfCalendars,
        sum_of_teams: statsData?.sumOfTeams,
        has_orgs_plan: !!data?.organizationId,
        organization: data?.organization?.slug,
        sum_of_event_types: statsData?.sumOfEventTypes,
        sum_of_team_event_types: statsData?.sumOfTeamEventTypes,
        is_premium: data?.isPremium,
      },
    });
  };

  const open = async () => {
    let userHash;

    const req = await fetch(`/api/intercom-hash`);
    const res = await req.json();
    if (res?.hash) {
      userHash = res.hash;
    }

    hookData.boot({
      ...(data && data?.name && { name: data.name }),
      ...(data && data?.email && { email: data.email }),
      ...(data && data?.id && { userId: data.id }),
      createdAt: String(dayjs(data?.createdDate).unix()),
      ...(userHash && { userHash }),
      customAttributes: {
        //keys should be snake cased
        user_name: data?.username,
        link: `${WEBSITE_URL}/${data?.username}`,
        admin_link: `${WEBAPP_URL}/settings/admin/users/${data?.id}/edit`,
        impersonate_user: `${WEBAPP_URL}/settings/admin/impersonation?username=${
          data?.email ?? data?.username
        }`,
        identity_provider: data?.identityProvider,
        timezone: data?.timeZone,
        locale: data?.locale,
        has_paid_plan: hasPaidPlan,
        has_team_plan: hasTeamPlan,
        metadata: data?.metadata,
        completed_onboarding: data?.completedOnboarding,
        is_logged_in: !!data,
        sum_of_bookings: statsData?.sumOfBookings,
        sum_of_calendars: statsData?.sumOfCalendars,
        sum_of_teams: statsData?.sumOfTeams,
        has_orgs_plan: !!data?.organizationId,
        organization: data?.organization?.slug,
        sum_of_event_types: statsData?.sumOfEventTypes,
        sum_of_team_event_types: statsData?.sumOfTeamEventTypes,
        is_premium: data?.isPremium,
      },
    });
    hookData.show();
  };
  return { ...hookData, open, boot };
};

export const useBootIntercom = () => {
  const { boot } = useIntercom();
  const { data: user } = trpc.viewer.me.get.useQuery();
  const { data: statsData } = trpc.viewer.me.myStats.useQuery(undefined, {
    trpc: {
      context: {
        skipBatch: true,
      },
    },
  });
  useEffect(() => {
    // not using useMediaQuery as it toggles between true and false
    const showIntercom = localStorage.getItem("showIntercom");
    if (!isInterComEnabled || showIntercom === "false" || window.innerWidth <= 768 || !user || !statsData)
      return;

    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, statsData]);
};

export default useIntercom;
