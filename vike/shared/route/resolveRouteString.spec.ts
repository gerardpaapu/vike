import { resolveRouteString } from './resolveRouteString.js'
import { stripAnsi } from '../../utils/stripAnsi.js'
import { expect, describe, it } from 'vitest'

const r: typeof resolveRouteString = (a, b) => resolveRouteString(a, b)

describe('resolveRouteString', () => {
  //*
  it('tmp', () => {
    expect(Array.from('abc'.match(/.*/)!)).toEqual(['abc'])
    expect(Array.from('abc'.match(/(.*)(b)(.*)/)!)).toEqual(['abc', 'a', 'b', 'c'])
    expect(Array.from('aaabc'.match(/(.*)(b)(.*)/)!)).toEqual(['aaabc', 'aaa', 'b', 'c'])
    expect(Array.from('abaabeec'.match(/(.*)(b)(.*)(c)/)!)).toEqual(['abaabeec', 'abaa', 'b', 'ee', 'c'])
    expect(Array.from('abaabeec'.match(/(.*)(b)(.*)(beec)/)!)).toEqual(['abaabeec', 'a', 'b', 'aa', 'beec'])
    expect(Array.from('/aaaa'.match(/(\/a)(.*)(a)/)!)).toEqual(['/aaaa', '/a', 'aa', 'a'])
    expect(Array.from('/a'.match(/^(\/)(.+)$/)!)).toEqual(['/a', '/', 'a'])
    expect(r('/@p', '/a')).toEqual({ routeParams: { p: 'a' } })
  })
  return
  //*/

  it('basics', () => {
    expect(r('/a', '/a')).toEqual({ routeParams: {} })
    expect(r('/', '/')).toEqual({ routeParams: {} })
    expect(r('/a/b', '/a/b')).toEqual({ routeParams: {} })
    expect(r('/a/b/c/d', '/a/b/c/d')).toEqual({ routeParams: {} })
    expect(r('/a', '/b')).toEqual(null)
  })

  it('parameterized routes', () => {
    expect(r('/@p', '/a')).toEqual({ routeParams: { p: 'a' } })
    expect(r('/@p', '/a/')).toEqual({ routeParams: { p: 'a' } })
    expect(r('/@p/b', '/a/b')).toEqual({ routeParams: { p: 'a' } })
    expect(r('/c/@p/b', '/c/a/b')).toEqual({ routeParams: { p: 'a' } })

    expect(r('/@p', '/a/b')).toEqual(null)
    expect(r('/@p', '/')).toEqual(null)
    expect(r('/@p', '/@p')).toEqual({ routeParams: { p: '@p' } })

    expect(r('/a/@p', '/a/b')).toEqual({ routeParams: { p: 'b' } })
    expect(r('/a/@p', '/a/b/')).toEqual({ routeParams: { p: 'b' } })
    expect(r('/a/@p', '/a/b/c/d')).toEqual(null)
    expect(r('/a/@p', '/a/b/c')).toEqual(null)
    expect(r('/a/@p', '/a/')).toEqual(null)
    expect(r('/a/@p', '/a')).toEqual(null)
    expect(r('/a/@p', '/c/b')).toEqual(null)
    expect(r('/a/@p', '/c')).toEqual(null)
    expect(r('/a/@p', '/c/')).toEqual(null)

    expect(r('/a/b/@p', '/a/b/c')).toEqual({ routeParams: { p: 'c' } })
    expect(r('/a/b/@p', '/a/b/')).toEqual(null)
    expect(r('/a/b/@p', '/a/b')).toEqual(null)
    expect(r('/a/b/@p', '/a/c/')).toEqual(null)
    expect(r('/a/b/@p', '/a/c')).toEqual(null)
    expect(r('/a/b/@p', '/a')).toEqual(null)

    expect(r('/@p1/@p2', '/a/b')).toEqual({ routeParams: { p1: 'a', p2: 'b' } })
    expect(r('/@p1/@p2', '/a/b/')).toEqual({ routeParams: { p1: 'a', p2: 'b' } })
    expect(r('/@p1/@p2', '/a/b/c/d')).toEqual(null)
    expect(r('/@p1/@p2', '/a/b/c')).toEqual(null)
  })

  it('glob - trailing', () => {
    expect(r('*', '/')).toEqual({ routeParams: { '*': '/' } })
    expect(r('/*', '/')).toEqual({ routeParams: { '*': '' } })
    expect(r('/*', '/a')).toEqual({ routeParams: { '*': 'a' } })
    expect(r('*', '/a')).toEqual({ routeParams: { '*': '/a' } })
    expect(r('/*', '/a/b')).toEqual({ routeParams: { '*': 'a/b' } })
    expect(r('*', '/a/b')).toEqual({ routeParams: { '*': '/a/b' } })
    expect(r('/*', '/a/b/c')).toEqual({ routeParams: { '*': 'a/b/c' } })
    expect(r('*', '/a/b/c')).toEqual({ routeParams: { '*': '/a/b/c' } })
    expect(r('/a/*', '/a/b')).toEqual({ routeParams: { '*': 'b' } })
    expect(r('/a/*', '/a/b/c/d')).toEqual({ routeParams: { '*': 'b/c/d' } })
    expect(r('/a/b/*', '/a/b/c/d')).toEqual({ routeParams: { '*': 'c/d' } })
    expect(r('/a/*', '/b/c')).toEqual(null)
  })
  it('glob - middle', () => {
    expect(r('/a/*/c', '/a/b/c')).toEqual({ routeParams: { '*': 'b' } })
    expect(r('/a/*/c', '/a/b/d')).toEqual(null)
    expect(r('/a/*/e', '/a/b/c/d/e')).toEqual({ routeParams: { '*': 'b/c/d' } })
    expect(r('/a*e', '/a/b/c/d/e')).toEqual({ routeParams: { '*': '/b/c/d/' } })
  })
  it('glob - multiple', () => {
    expect(r('/a/*/c/*/e', '/a/b/c/d/e')).toEqual({ routeParams: { '*1': 'b', '*2': 'd' } })
    expect(r('/a/*/c/*', '/a/b/c/d/e')).toEqual({ routeParams: { '*1': 'b', '*2': 'd/e' } })
    expect(r('*a*', '/a/b/c/d/e')).toEqual({ routeParams: { '*1': '/', '*2': '/b/c/d/e' } })
    expect(r('*a*e', '/a/b/c/d/e')).toEqual({ routeParams: { '*1': '/', '*2': '/b/c/d/' } })
    expect(r('*a*c', '/a/b/c/d/e')).toEqual(null)
    expect(r('*a*c*', '/a/b/c/d/e')).toEqual({ routeParams: { '*1': '/', '*2': '/b/', '*3': '/d/e' } })
  })
  it('glob - ambigious matching', () => {
    expect(r('*a*c*', '/a/b/c/b/a')).toEqual({ routeParams: { '*1': '/', '*2': '/b/', '*3': '/b/a' } })
    // expect(r('/a*a', '/aaaa')).toEqual({ routeParams: { '*': 'aa' } })
    // expect(r('*a', '/aaaa')).toEqual({ routeParams: { '*': '/aaa' } })
  })
  it('glob - BurdaForward', () => {
    // Use case 1
    expect(r('/some/*.html', '/some/a.html')).toEqual({ routeParams: { '*': 'a' } })
    expect(r('/some/*.html', '/some/a/b/c.html')).toEqual({ routeParams: { '*': 'a/b/c' } })
    // Use case 2
    expect(r('/some/route*.html', '/some/route.html')).toEqual({ routeParams: { '*': '' } })
    expect(r('/some/route*.html', '/some/route-a.html')).toEqual({ routeParams: { '*': '-a' } })
    expect(r('/some/route*.html', '/some/routea/b/c.html')).toEqual({ routeParams: { '*': 'a/b/c' } })
  })

  it('special characters', () => {
    expect(r('/@p', '/\\')).toEqual({ routeParams: { p: '\\' } })
    expect(r('/a/@p', '/a/\\')).toEqual({ routeParams: { p: '\\' } })
    expect(r('/a/@p', '/a/b')).toEqual({ routeParams: { p: 'b' } })
    expect(r('/a/@p', '/a\\b')).toEqual(null)

    expect(r('/@p', '/!(')).toEqual({ routeParams: { p: '!(' } })
    expect(r('/*', '/!(')).toEqual({ routeParams: { '*': '!(' } })
    expect(r('/@p', '/¥')).toEqual({ routeParams: { p: '¥' } })
    expect(r('/*', '/¥')).toEqual({ routeParams: { '*': '¥' } })
  })

  it('invalid route string', () => {
    expectErr(() => r('', '/a/b/c'), `[vike][Wrong Usage] Invalid Route String '' (empty string): set it to / instead`)
    expectErr(() => r('a', '/a/b/c'), `[vike][Wrong Usage] Invalid Route String a: it should start with / or *`)
    expectErr(() => r('/a**b', '/a/b/c'), `[vike][Wrong Usage] Invalid Route String /a**b: set it to /a*b instead`)
  })
})

function expectErr(fn: Function, errMsg: string) {
  {
    let err: Error | undefined
    try {
      fn()
    } catch (err_) {
      err = err_ as Error
    }
    expect(err).toBeTruthy()
    expect(stripAnsi(err!.message)).toBe(errMsg)
  }
}
