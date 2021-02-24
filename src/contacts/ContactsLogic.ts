import { v4 as uuid } from "uuid";
import { NamedNode, Node, st, term } from "rdflib";
import { LiveStore, SolidNamespace } from "../index";
import { ProfileLogic } from "../profile/ProfileLogic";
import { UtilityLogic } from "../util/UtilityLogic";
import { newThing } from "../uri";
import ns from "solid-namespace";

interface NewPaneOptions {
  me?: NamedNode;
  newInstance?: NamedNode;
  newBase: string;
}

interface CreatedPaneOptions {
  newInstance: NamedNode;
}

export class Contact {
  uri: NamedNode
  store: LiveStore

  constructor(uri: NamedNode, store: LiveStore) {
    this.uri = uri;
    this.store = store;
  }

}

export class Addressbook {
  uri: NamedNode
  store: LiveStore

  constructor(uri: NamedNode, store: LiveStore) {
    this.uri = uri;
    this.store = store;
  }

  async fetch(): Promise<void> {
    this.store.fetcher.load(this.uri.doc().value);
  }

  getMembers(): Contact[] {
    // FIXME: https://gitter.im/solid/solidos?at=603659fb4821572018f9d82d
    const members: Node[] = this.store.each(null, ns('vcard:inAddressBook'), this.uri, this.uri.doc());
    return members.map((node: Node) => new Contact(node as NamedNode, this.store));
  }
}

/**
 * Contacts-related logic
 */
export class ContactsLogic {
  store: LiveStore;
  ns: SolidNamespace;
  profile: ProfileLogic;
  util: UtilityLogic;

  constructor(store: LiveStore, ns: SolidNamespace, profile: ProfileLogic, util: UtilityLogic) {
    this.store = store;
    this.ns = ns;
    this.profile = profile;
    this.util = util;
  }

  async getAddressbook(
    uri: NamedNode
  ): Promise<Addressbook> {
    const addressbook = new Addressbook(uri, this.store);
    await addressbook.fetch();
    return addressbook;
  }
}
