/* Logic to access public data stores
*
* including filtering resut by natural language etc
* See https://solidos.solidcommunity.net/public/2021/01%20Building%20Solid%20Apps%20which%20use%20Public%20Data.html
*/
/* eslint-disable no-console */
import * as debug from "../debug";
import * as logic from '../index'
import * as authn from '../authn/index'
import { Collection, NamedNode, Node } from 'rdflib'
import { LiveStore, SolidNamespace, AuthnLogic} from '../index'
// import { Binding } from '../widgets/forms/autocomplete/publicData'
import { nativeNameForLanguageCode, englishNameForLanguageCode } from './nativeNameForLanguageCode'

// const { currentUser } = logic.authn

export interface Binding {
  subject: Node;
  name?: Node
  location?: Node
  coordinates?: Node
}

export const languageCodeURIBase = 'https://www.w3.org/ns/iana/language-code/' /// @@ unsupported on the web (2021)

export const defaultPreferedLangages = ['en', 'fr', 'de', 'it']

/**
 * Language-related logic
 */
export class LanguageLogic {
  store: LiveStore;
  ns: SolidNamespace;
  authn: AuthnLogic;

  constructor(store: LiveStore, ns: SolidNamespace, authn: AuthnLogic ) { // profile: ProfileLogic
    this.store = store;
    this.ns = ns;
    this.authn = authn;
  }

  async getPreferredLanagugesForOLD(person: NamedNode) {
    const kb = this.store // 20210506
    const ns = this.ns
    await kb.fetcher.load(person.doc())
    const list = kb.any(person, ns.schema('knowsLanguage'), null, person.doc()) as Collection | undefined
    if (!list) {
      console.log(`User ${person} has not set their languages in their profile.`)
      return null // differnet from []
    }
    const languageCodeArray: string[] = []
    list.elements.forEach(item => {
      const lang = kb.any(item as any, ns.solid('publicId'), null, (item as NamedNode).doc())
      if (!lang) {
        console.warn('getPreferredLanguages: No publiID of language.')
        return
      }
      if (!lang.value.startsWith(languageCodeURIBase)) {
        console.error(`What should be a language code ${lang.value} does not start with ${languageCodeURIBase}`)
        return
      }
      const code = lang.value.slice(languageCodeURIBase.length)
      languageCodeArray.push(code)
    })

    if (languageCodeArray.length > 0) {
      console.log(`     User knows languages with codes: "${languageCodeArray.join(',')}"`)
      return languageCodeArray
    }
    return null
  }

  async getPreferredLanguages () {
    // In future:  cache in the login session for speed, but get from profile and private prefs
    // @@ TEESTING ONLY
    const kb = this.store
    const me = null; // kb.sym('https://timbl.solidcommunity.net/') //await currentUser() as NamedNode @@
    if (me) { // If logged in
      return this.getPreferredLanagugesForOLD(me) || defaultPreferedLangages
    }
    return defaultPreferedLangages
  }
}


export async function getPreferredLanagugesForOLD(kb, ns, person) {
  await kb.fetcher.load(person.doc())
  const list = kb.any(person, ns.schema('knowsLanguage'), null, person.doc()) as Collection | undefined
  if (!list) {
    console.log(`User ${person} has not set their languages in their profile.`)
    return null // differnet from []
  }
  const languageCodeArray: string[] = []
  list.elements.forEach(item => {
    const lang = kb.any(item as any, ns.solid('publicId'), null, (item as NamedNode).doc())
    if (!lang) {
      console.warn('getPreferredLanguages: No publiID of language.')
      return
    }
    if (!lang.value.startsWith(languageCodeURIBase)) {
      console.error(`What should be a language code ${lang.value} does not start with ${languageCodeURIBase}`)
      return
    }
    const code = lang.value.slice(languageCodeURIBase.length)
    languageCodeArray.push(code)
  })

  if (languageCodeArray.length > 0) {
    console.log(`     User knows languages with codes: "${languageCodeArray.join(',')}"`)
    return languageCodeArray
  }
  return null
}

export async function getMyPreferredLanguages (kb, ns) {
  // In future:  cache in the login session for speed, but get from profile and private prefs
  // @@ TEESTING ONLY
  const me = null; // kb.sym('https://timbl.solidcommunity.net/') //await currentUser() as NamedNode @@
  if (me) { // If logged in
    return getPreferredLanagugesForOLD(kb, ns, me) || defaultPreferedLangages
  }
  return defaultPreferedLangages
}


/* From an array of bindings with a names for each row,
 * remove dupliacte names for the same thing, leaving the user's
 * preferred language version
*/

export function filterByLanguageOLD (bindings, languagePrefs) {
  const uris = {}
  bindings.forEach(binding => { // Organize names by their subject
    const uri = binding.subject.value
    uris[uri] = uris[uri] || []
    uris[uri].push(binding)
  })

  const languagePrefs2 = languagePrefs // OLD
  languagePrefs2.reverse() // prefered last OLD

  const slimmed = ([] as Array<Binding>)
  for (const u in uris) { // needs hasOwnProperty ?
    const bindings = uris[u]
    const sortMe = bindings.map(binding => {
      return [languagePrefs2.indexOf(binding.name['xml:lang']), binding]
    })
    sortMe.sort() // best at th ebottom
    sortMe.reverse() // best at the top
    slimmed.push((sortMe[0][1] as any))
  } // map u
  debug.log(` Filter by language: ${bindings.length} -> ${slimmed.length}`)
  return slimmed
}
