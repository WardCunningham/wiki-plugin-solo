
(function() {

  function expand(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*(.+?)\*/g, '<i>$1</i>')
  }

  async function emit($item, item) {
    const testurl = 'https://raw.githubusercontent.com/WardCunningham/search/master/README.graph.jsonl'
    const testjsonl = await fetch(testurl).then(res => res.text())
    const names = testjsonl.trim().split(/\n/)
      .map(line => JSON.parse(line))
      .map(obj => obj.name)
    return $item.append(`
      <p style="background-color:#eee;padding:15px;">
        ${names.join("<br>")}
      </p><p>
        <button onclick="window.plugins.solo.dopopup(event)">view in solo</button>
      </p>`)
  }

  const dopopup = event => {
    console.log('target',event.target)
    window.open('/plugins/solo/dialog/#','solo','popup,height=720,width=1280')
  }

  // window.plugins.solo.dopopup = popup

  function bind($item, item) {
    return $item.dblclick(() => {
      return wiki.textEditor($item, item);
    })
  }

  if (typeof window !== "undefined" && window !== null) {
    window.plugins.solo = {emit, bind, dopopup}
  }

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {expand}
  }

}).call(this)
