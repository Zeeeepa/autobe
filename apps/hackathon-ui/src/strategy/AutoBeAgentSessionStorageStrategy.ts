import hApi, { HttpError } from "@autobe/hackathon-api";
import { IAutoBeHackathonSession, IPage } from "@autobe/interface";
import {
  IAutoBeAgentSession,
  IAutoBeAgentSessionStorageStrategy,
} from "@autobe/ui";

import { HACKATHON_CODE } from "../constant";
import { useAuthorizationToken } from "../hooks/useAuthorizationToken";

export class AutoBeAgentSessionStorageStrategy
  implements IAutoBeAgentSessionStorageStrategy
{
  appendEvent(): Promise<void> {
    return Promise.resolve();
  }
  setTokenUsage(): Promise<void> {
    return Promise.resolve();
  }

  async getSession(
    props: Pick<IAutoBeAgentSession, "id">,
  ): Promise<IAutoBeAgentSession> {
    const { getToken } = useAuthorizationToken();
    const token = getToken();

    const result: IAutoBeHackathonSession =
      await hApi.functional.autobe.hackathon.participants.sessions.at(
        {
          host: import.meta.env.VITE_API_BASE_URL,
          headers: {
            Authorization: `Bearer ${token.token.access}`,
          },
        },
        HACKATHON_CODE,
        props.id,
      );
    return {
      id: result.id,
      title: result.participant.name,
      history: result.histories,
      tokenUsage: result.token_usage,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.completed_at ?? result.created_at),
      events: result.event_snapshots.map((event) => ({
        type: event.event.type,
        events: [event.event],
      })),
    };
  }
  async getSessionList(): Promise<IAutoBeAgentSession[]> {
    const { getToken } = useAuthorizationToken();
    const token = getToken();

    const result: IPage<IAutoBeHackathonSession.ISummary> =
      await hApi.functional.autobe.hackathon.participants.sessions
        .index(
          {
            host: import.meta.env.VITE_API_BASE_URL,
            headers: {
              Authorization: `Bearer ${token.token.access}`,
            },
          },
          HACKATHON_CODE,
          {
            page: 1,
            limit: 100,
          },
        )
        .catch((e) => {
          if (e instanceof HttpError && e.status === 403) {
            window.location.href = "/login";
          }
          throw e;
        });

    return result.data.map((session) => ({
      id: session.id,
      title: session.title ?? "Untitled",
      history: [],
      tokenUsage: session.token_usage,
      createdAt: new Date(session.created_at),
      updatedAt: new Date(session.completed_at ?? session.created_at),
      events: [],
    }));
  }
  async deleteSession(props: Pick<IAutoBeAgentSession, "id">): Promise<void> {
    const { getToken } = useAuthorizationToken();
    const token = getToken();

    await hApi.functional.autobe.hackathon.participants.sessions.erase(
      {
        host: import.meta.env.VITE_API_BASE_URL,
        headers: {
          Authorization: `Bearer ${token.token.access}`,
        },
      },
      HACKATHON_CODE,
      props.id,
    );
  }
  async appendHistory(): Promise<void> {
    return Promise.resolve();
  }

  async editSessionTitle(
    props: Pick<IAutoBeAgentSession, "id" | "title">,
  ): Promise<void> {
    const { getToken } = useAuthorizationToken();
    const token = getToken();

    await hApi.functional.autobe.hackathon.participants.sessions.update(
      {
        host: import.meta.env.VITE_API_BASE_URL,
        headers: {
          Authorization: `Bearer ${token.token.access}`,
        },
      },
      HACKATHON_CODE,
      props.id,
      {
        title: props.title,
      },
    );
  }
}
