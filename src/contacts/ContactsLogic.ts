import * as rdf from "rdflib"
import { NamedNode, Node } from "rdflib";
import { LiveStore, SolidNamespace } from "../index";
import solidNamespace from "solid-namespace";
const ns: SolidNamespace = solidNamespace(rdf);

export class Contact {
  uri: NamedNode
  store: LiveStore

  constructor(uri: NamedNode, store: LiveStore) {
    this.uri = uri;
    this.store = store;
  }

  getFullName(): string | null {
    const node = this.store.any(this.uri, ns.vcard('fn'));
    return (node ? node.value : null);
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
    await this.store.fetcher.load(this.uri.doc().value);
  }

  getMembers(): Contact[] {
    // FIXME: https://gitter.im/solid/solidos?at=603659fb4821572018f9d82d
    const members: Node[] = this.store.each(null, ns.vcard('inAddressBook'), this.uri, this.uri.doc());
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
