
(function() {

  const delay = time => new Promise(res => setTimeout(res,time));

  function expand(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*(.+?)\*/g, '<i>$1</i>')
  }

  function lineup ($item){
    const items = [...document.querySelectorAll('.item')]
    const index = items.indexOf($item.get(0))
    const sources = items.slice(0,index)
      .filter(item => item.classList.contains('aspect-source'))
      .map(item => {
        const source = item.closest('.page').id.replaceAll(/-/g,' ')
        const aspects = item.aspectData && item.aspectData() || []
        return {source,aspects}
      })
    return sources
  }

  // https://github.com/bitinn/node-fetch/issues/481
  function absolute(url) {
    return url.replace(/^(https?:)\/([^\/])/,`$1//${location.host}/$2`)
  }

  function parse($item, {text,aspects=[]}) {
    let graphs = []
    let output = text.split(/\r?\n/).map (line => {
      var m

      if (m = line.match(/^ASSETS$/)) {
        line = `ASSETS <i onclick=doassets(event) style="cursor:pointer;">continue</i>`
        graphs.push(new Promise(resolve => {
          window.doassets = async event => {
            const want = assets($item)
            const {site,dir,file} = want[0]
            const have = await link(`${site}/${dir}/${file}`)
              .then(aspects => ({source:file,aspects}))
            console.log({have})
            event.target.outerHTML = `<br>
              &nbsp; ${want.length} sources, ${have.aspects.length} aspects`
            resolve(have)
          }
        }))
      }

      else if (m = line.match(/^LINK (\w+) (https?:\S+.jsonl)$/)) {
        const graph = link(absolute(m[2]))
          .then(aspects => ({source:m[1],aspects}))
        graphs.push(graph)
        line = `LINK <a href="${absolute(m[2])}" target=_blank>${m[1]} <img src="/images/external-link-ltr-icon.png"></a>`
      }

      else if (m = line.match(/^LINEUP$/)) {
        const sources = lineup($item)
        graphs.push(...sources)
        line = `LINEUP<br> &nbsp;
          ${sources.length} sources,
          ${sources.map(source => source.aspects.length).toString()||'no'} aspects`
      }

      else if (m = line.match(/^INCLUDED(.*)$/)) {
        const source = m[1].trim() || 'included'
        graphs.push({source,aspects})
        line = `INCLUDED${m[1]}<br> &nbsp;
          ${aspects.length} aspects`
      }

      else {
        line = `<font color=gray>${expand(line)}</font>`
      }

      return line
    }).join('<br>')
    console.log({graphs})
    return {output, graphs}
  }

  function assets($item) {
    const sources = [...$item.get(0).parentElement.children]
      .filter(e => e.classList.contains('assets-source'))
      .map(e => e.assetsData())
    console.log({sources})
    const want = sources
      .map(d1 => Object.entries(d1)
        .map(([dir,d2]) => Object.entries(d2)
          .map(([site,d3]) => d3
            .filter(file => file.endsWith('.jsonl'))
            .map(file => ({dir,site,file}) ))))
      .flat(3)
    console.log({want})
    return want
  }

  async function link(url) {
    const text = await fetch(url).then(res => res.text())
    const lines = text.trim().split(/\n/)
    return lines.map(line => JSON.parse(line))
  }


  let parsed
  let todo = []
  let pageKey
  async function emit($item, item) {
    pageKey = $item.parents('.page').data('key')
    parsed = parse($item, item)
    $item.append(`
      <div style="background-color:#eee;padding:15px;">
        <p>${parsed.output}</p>
      </div>`)
    todo = await Promise.all(parsed.graphs)
    console.log({todo})
    const included = todo
      .filter(source => source.source == 'included')
      .map(source => source.aspects)
      .flat()
    if (included.length) {
      $item.addClass('aspect-source')
      $item.get(0).aspectData = () => included
    }
    $item.find('div').append(`
      <p><button onclick="window.plugins.solo.dopopup(event)">
        view in solo
      </button></p>`)
  }

  const dopopup = event => {
    const doing = {type:'batch', sources:todo, pageKey}
    const popup = window.open('/plugins/solo/dialog/#','solo','popup,height=720,width=1280')
    if (popup.location.pathname != '/plugins/solo/dialog/'){
      console.log('launching new dialog')
      popup.addEventListener('load', event => {
        console.log('launched and loaded')
        popup.postMessage(doing, window.origin)
      })
    }
    else {
      console.log('reusing existing dialog')
      popup.postMessage(doing, window.origin)
    }
  }

  // window.plugins.solo.dopopup = popup

  function bind($item, item) {
    return $item.dblclick(() => {
      return wiki.textEditor($item, item);
    })
  }


  function soloListener(event) {

    if (!event.data) return
    const { data } = event
    if (data?.action == "publishSourceData" && data?.name == "aspect") {
      if (wiki.debug) console.log('soloListener - source update', {event,data})
      return
    }

    // only continue if event is from a solo popup.
    // events from a popup window will have an opener
    // ensure that the popup window is one of ours

    if (!event.source.opener || event.source.location.pathname !== '/plugins/solo/dialog/') {
      if (wiki.debug) {console.log('soloListener - not for us', {event})}
      return
    }
    if (wiki.debug) {console.log('soloListener - ours', {event})}

    const { action, keepLineup=false, pageKey=null, title=null, context=null, page=null} = data;

    let $page = null
    if (pageKey != null) {
      $page = keepLineup ? null : $('.page').filter((i, el) => $(el).data('key') == pageKey)
    }

    switch (action) {
      case 'doInternalLink':
        wiki.pageHandler.context = context
        wiki.doInternalLink(title, $page)
        break
      case 'showResult':
        const options = keepLineup ? {} : {$page}
        wiki.showResult(wiki.newPage(page), options)
        break
      default:
        console.error({ where:'soloListener', message: "unknown action", data })
    }
  }

  if (typeof window !== "undefined" && window !== null) {
    // moduleLoaded = import('/plugins/graphviz/graphviz-viewer.js');
    // window.plugins.graphviz = {emit, bind};
    if (typeof window.soloListener !== "undefined" || window.soloListener == null) {
      console.log('**** Adding solo listener')
      window.soloListener = soloListener
      window.addEventListener("message", soloListener)
    }
  }

  if (typeof window !== "undefined" && window !== null) {
    window.plugins.solo = {emit, bind, dopopup}
  }

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {expand}
  }

}).call(this)
