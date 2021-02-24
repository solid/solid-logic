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
const addressbook = rdf.sym("https://alice.example/addressbook.ttl#this");
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
    describe("When Addressbook contains Bob", () => {
      let result;
      beforeEach(async () => {
        addressbookContainsBob();
        const addressbookObj = await contacts.getAddressbook(addressbook);
        result = addressbookObj.getMembers();
      });
      it("Resolves to an array containing Bob", () => {
        expect(result.length).toEqual(1);
        expect(result[0].getFullName()).toEqual("Bob the Builder");
      });
    });
  });

  function addressbookIsEmpty() {
    fetchMock.mockOnceIf(
      addressbook.doc().value,
      " ",
      {
        headers: { "Content-Type": "text/turtle" },
      }
    );
  }

  function addressbookContainsBob() {
    fetchMock.mockOnceIf(
      addressbook.doc().value,
      "@prefix   acl: <http://www.w3.org/ns/auth/acl#> .\n" +
      "@prefix    dc: <http://purl.org/dc/elements/1.1/> .\n" +
      "@prefix vcard: <http://www.w3.org/2006/vcard/ns#> .\n" +
      "<#this> a vcard:AddressBook ;\n" +
      " dc:title  \"New address Book\" ;\n" +
      " acl:owner </profile/card#me> .\n" +
      "<#bob> a vcard:Individual ;\n" +
      "  vcard:inAddressBook <#this> ;\n" +
      "  vcard:fn            \"Bob the Builder\" ;\n" +
      "  vcard:url [ a vcard:WebID ; vcard:value <https://bob.example/profile/card#me> ] ;\n" +
      "  vcard:url [ a vcard:WebID ; vcard:value <https://bob.alternative/profile/card#me> ] .\n",
      {
        headers: { "Content-Type": "text/turtle" },
      }
    );
  }
});
