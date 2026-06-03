import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  it("loads Jira config from environment variables", () => {
    const config = loadConfig({
      JIRA_EMAIL: "bot@example.com",
      JIRA_API_TOKEN: "token",
      JIRA_ALLOWED_HOSTS: "one.atlassian.net, two.atlassian.net ",
      JIRA_REQUIREMENT_FIELDS:
        '{"acceptanceCriteria":"customfield_10042","storyPoints":"customfield_10016"}'
    });

    expect(config).toEqual({
      email: "bot@example.com",
      apiToken: "token",
      cookie: "",
      authType: "basic",
      apiVersion: "3",
      allowedHosts: ["one.atlassian.net", "two.atlassian.net"],
      requirementFields: {
        acceptanceCriteria: "customfield_10042",
        storyPoints: "customfield_10016"
      }
    });
  });

  it("normalizes allowed host URLs to hostnames", () => {
    const config = loadConfig({
      JIRA_EMAIL: "bot@example.com",
      JIRA_API_TOKEN: "token",
      JIRA_ALLOWED_HOSTS: "https://jira.in.wezhuiyi.com/"
    });

    expect(config.allowedHosts).toEqual(["jira.in.wezhuiyi.com"]);
  });

  it("loads Jira Data Center bearer auth settings", () => {
    const config = loadConfig({
      JIRA_API_TOKEN: "pat-token",
      JIRA_AUTH_TYPE: "bearer",
      JIRA_API_VERSION: "latest",
      JIRA_ALLOWED_HOSTS: "jira.in.wezhuiyi.com"
    });

    expect(config).toMatchObject({
      email: "",
      apiToken: "pat-token",
      cookie: "",
      authType: "bearer",
      apiVersion: "latest",
      allowedHosts: ["jira.in.wezhuiyi.com"]
    });
  });

  it("loads Jira cookie auth settings", () => {
    const config = loadConfig({
      JIRA_AUTH_TYPE: "cookie",
      JIRA_COOKIE: "JSESSIONID=session; atlassian.xsrf.token=token",
      JIRA_API_VERSION: "latest",
      JIRA_ALLOWED_HOSTS: "jira.in.wezhuiyi.com"
    });

    expect(config).toMatchObject({
      email: "",
      apiToken: "",
      cookie: "JSESSIONID=session; atlassian.xsrf.token=token",
      authType: "cookie",
      apiVersion: "latest",
      allowedHosts: ["jira.in.wezhuiyi.com"]
    });
  });

  it("infers cookie auth and latest API version from JIRA_COOKIE", () => {
    const config = loadConfig({
      JIRA_COOKIE: "JSESSIONID=session; atlassian.xsrf.token=token",
      JIRA_ALLOWED_HOSTS: "jira.in.wezhuiyi.com"
    });

    expect(config).toMatchObject({
      email: "",
      apiToken: "",
      cookie: "JSESSIONID=session; atlassian.xsrf.token=token",
      authType: "cookie",
      apiVersion: "latest",
      allowedHosts: ["jira.in.wezhuiyi.com"]
    });
  });

  it("defaults bearer auth to the latest API version", () => {
    const config = loadConfig({
      JIRA_API_TOKEN: "pat-token",
      JIRA_AUTH_TYPE: "bearer",
      JIRA_ALLOWED_HOSTS: "jira.in.wezhuiyi.com"
    });

    expect(config).toMatchObject({
      authType: "bearer",
      apiVersion: "latest"
    });
  });

  it("fails when cookie auth cookie is missing", () => {
    expect(() =>
      loadConfig({
        JIRA_AUTH_TYPE: "cookie",
        JIRA_ALLOWED_HOSTS: "jira.in.wezhuiyi.com"
      })
    ).toThrow("Missing required environment variable: JIRA_COOKIE");
  });

  it("fails when basic auth email is missing", () => {
    expect(() =>
      loadConfig({
        JIRA_API_TOKEN: "token",
        JIRA_ALLOWED_HOSTS: "one.atlassian.net"
      })
    ).toThrow("Missing required environment variable: JIRA_EMAIL");
  });

  it("fails when required variables are missing", () => {
    expect(() => loadConfig({})).toThrow(
      "Missing required environment variable: JIRA_API_TOKEN"
    );
  });

  it("fails when no allowed hosts are configured", () => {
    expect(() =>
      loadConfig({
        JIRA_EMAIL: "bot@example.com",
        JIRA_API_TOKEN: "token",
        JIRA_ALLOWED_HOSTS: " , "
      })
    ).toThrow("JIRA_ALLOWED_HOSTS must include at least one host");
  });

  it("fails when requirement field JSON is invalid", () => {
    expect(() =>
      loadConfig({
        JIRA_EMAIL: "bot@example.com",
        JIRA_API_TOKEN: "token",
        JIRA_ALLOWED_HOSTS: "one.atlassian.net",
        JIRA_REQUIREMENT_FIELDS: "{bad json"
      })
    ).toThrow("JIRA_REQUIREMENT_FIELDS must be valid JSON");
  });
});
