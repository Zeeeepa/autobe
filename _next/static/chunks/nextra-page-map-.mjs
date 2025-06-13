import meta from "../../../pages/_meta.js";
import docs_meta from "../../../pages/docs/_meta.js";
import docs_agent_meta from "../../../pages/docs/agent/_meta.js";
import docs_backend_meta from "../../../pages/docs/backend/_meta.js";
import docs_concepts_meta from "../../../pages/docs/concepts/_meta.js";
import docs_related_meta from "../../../pages/docs/related/_meta.js";
import docs_websocket_meta from "../../../pages/docs/websocket/_meta.js";
export const pageMap = [{
  data: meta
}, {
  name: "docs",
  route: "/docs",
  children: [{
    data: docs_meta
  }, {
    name: "agent",
    route: "/docs/agent",
    children: [{
      data: docs_agent_meta
    }, {
      name: "config",
      route: "/docs/agent/config",
      frontMatter: {
        "sidebarTitle": "Config"
      }
    }, {
      name: "event",
      route: "/docs/agent/event",
      frontMatter: {
        "sidebarTitle": "Event"
      }
    }, {
      name: "history",
      route: "/docs/agent/history",
      frontMatter: {
        "sidebarTitle": "History"
      }
    }, {
      name: "index",
      route: "/docs/agent",
      frontMatter: {
        "sidebarTitle": "Index"
      }
    }]
  }, {
    name: "backend",
    route: "/docs/backend",
    children: [{
      data: docs_backend_meta
    }, {
      name: "e2e",
      route: "/docs/backend/e2e",
      frontMatter: {
        "sidebarTitle": "E2e"
      }
    }, {
      name: "index",
      route: "/docs/backend",
      frontMatter: {
        "sidebarTitle": "Index"
      }
    }, {
      name: "nestjs",
      route: "/docs/backend/nestjs",
      frontMatter: {
        "sidebarTitle": "Nestjs"
      }
    }, {
      name: "prisma",
      route: "/docs/backend/prisma",
      frontMatter: {
        "sidebarTitle": "Prisma"
      }
    }]
  }, {
    name: "concepts",
    route: "/docs/concepts",
    children: [{
      data: docs_concepts_meta
    }, {
      name: "compiler",
      route: "/docs/concepts/compiler",
      frontMatter: {
        "title": "Guide Documents > Concepts > Compiler"
      }
    }, {
      name: "waterfall",
      route: "/docs/concepts/waterfall",
      frontMatter: {
        "title": "Guide Documents > Concepts > Waterfall"
      }
    }]
  }, {
    name: "index",
    route: "/docs",
    frontMatter: {
      "asIndexPage": true,
      "sidebarTitle": "Index"
    }
  }, {
    name: "related",
    route: "/docs/related",
    children: [{
      data: docs_related_meta
    }, {
      name: "agentica",
      route: "/docs/related/agentica",
      frontMatter: {
        "sidebarTitle": "Agentica"
      }
    }, {
      name: "autoview",
      route: "/docs/related/autoview",
      frontMatter: {
        "sidebarTitle": "Autoview"
      }
    }]
  }, {
    name: "roadmap",
    route: "/docs/roadmap",
    frontMatter: {
      "sidebarTitle": "Roadmap"
    }
  }, {
    name: "setup",
    route: "/docs/setup",
    frontMatter: {
      "sidebarTitle": "Setup"
    }
  }, {
    name: "websocket",
    route: "/docs/websocket",
    children: [{
      data: docs_websocket_meta
    }, {
      name: "client",
      route: "/docs/websocket/client",
      frontMatter: {
        "sidebarTitle": "Client"
      }
    }, {
      name: "index",
      route: "/docs/websocket",
      frontMatter: {
        "sidebarTitle": "Index"
      }
    }, {
      name: "nestjs",
      route: "/docs/websocket/nestjs",
      frontMatter: {
        "sidebarTitle": "Nestjs"
      }
    }, {
      name: "nodejs",
      route: "/docs/websocket/nodejs",
      frontMatter: {
        "sidebarTitle": "Nodejs"
      }
    }]
  }]
}, {
  name: "index",
  route: "/",
  frontMatter: {
    "sidebarTitle": "Index"
  }
}];