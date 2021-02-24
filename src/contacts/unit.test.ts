/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { UtilityLogic } from "../util/UtilityLogic";
import solidNamespace from "solid-namespace";

import * as rdf from "rdflib";
import { ProfileLogic } from "../profile/ProfileLogic";
import fetchMock from "jest-fetch-mock";
import { UpdateManager } from "rdflib";
import { ContactsLogic } from "./ContactsLogic";

const ns = solidNamespace(rdf);

const alice = rdf.sym("https://alice.example/profile/card#me");
const addressbook = rdf.sym("https://alice.example/addressbook.ttl");
const bob = rdf.sym("https://bob.example/profile/card#me");

describe("Addressbook", () => {
  let contacts;
  let store;
  beforeEach(() => {
    fetchMock.resetMocks();
    fetchMock.mockResponse("Not Found", {
      status: 404,
    });
    const fetcher = { fetch: fetchMock };
    store = rdf.graph();
    store.fetcher = rdf.fetcher(store, fetcher);
    store.updater = new UpdateManager(store);
    const authn = {
      currentUser: () => {
        return alice;
      },
    };
    const profile = new ProfileLogic(store, ns, authn);
    const util = new UtilityLogic(store, ns, fetcher);
    contacts = new ContactsLogic(store, ns, profile, util);
  });

  describe("getMembers", () => {
    describe("When Addressbook is empty", () => {
      let result;
      beforeEach(async () => {
        addressbookIsEmpty();
        const addressbookObj = await contacts.getAddressbook(addressbook);
        result = addressbookObj.getMembers();
      });
      it("Resolves to an empty array", () => {
        expect(result).toEqual([]);
      });
    });
  });

  function addressbookIsEmpty() {
    fetchMock.mockOnceIf(
      addressbook.value,
      " ",
      {
        headers: { "Content-Type": "text/turtle" },
      }
    );
  }
});