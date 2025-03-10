App.SECOND = 1000
App.MINUTE = App.SECOND * 60
App.HOUR = App.MINUTE * 60
App.DAY = App.HOUR * 24
App.MONTH = App.DAY * 30
App.YEAR = App.DAY * 365

App.setup_keyboard = () => {
  DOM.ev(document, `keydown`, (e) => {
    let n = parseInt(e.key)

    if (e.key === `Enter`) {
      if (Popmsg.instance && Popmsg.instance.msg.is_open()) {
        let now = Date.now()

        if ((now - Popmsg.instance.date) > 100) {
          e.preventDefault()
          Popmsg.instance.msg.close()
        }
      }
      else if (Confirmbox.instance && Confirmbox.instance.msg.is_open()) {
        e.preventDefault()
        Confirmbox.instance.action()
      }
      else if (Msg.msg && Msg.msg.any_open()) {
        let content = Msg.msg.highest_instance().content
        let dialog = DOM.el(`.dialog_container`, content)

        if (dialog) {
          let first = DOM.el(`.aero_button`, dialog)

          if (first) {
            e.preventDefault()
            first.click()
          }
        }
      }
    }
    else if (!isNaN(n) && (n >= 1) && (n <= 9)) {
      if (Msg.msg && Msg.msg.any_open()) {
        let content = Msg.msg.highest_instance().content
        let dialog = DOM.el(`.dialog_container`, content)

        if (dialog) {
          let buttons = DOM.els(`.aero_button`, dialog)

          if (n <= buttons.length) {
            e.preventDefault()
            buttons[n - 1].click()
          }
        }
      }
    }
    else if (e.key === `m`) {
      if (e.ctrlKey && !e.shiftKey) {
        if (Msg.msg && Msg.msg.any_open()) {
          // Do nothing
        }
        else {
          e.preventDefault()
          let show_return = App.mode !== `index`
          App.setup_menu_opts(show_return, true)
        }
      }
    }
    else if (e.key === `ArrowRight`) {
      if (e.ctrlKey && !e.shiftKey) {
        App.next_post()
      }
      else if (e.ctrlKey && e.shiftKey) {
        App.random_post()
      }
    }
    else if (e.key === `ArrowUp`) {
      if (e.ctrlKey && !e.shiftKey) {
        App.fresh_post()
      }
    }
  })
}

App.setup_mouse = () => {
  DOM.ev(document, `mousedown`, (e) => {
    if (e.button === 1) {
      e.preventDefault()
    }
  })
}

App.singplural = (what, length) => {
  if (length === 1) {
    return what
  }

  return `${what}s`
}

App.shuffle_array = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }

  return array
}

App.copy_to_clipboard = (text) => {
  navigator.clipboard.writeText(text)
}

App.select_all = (el) => {
  let selection = window.getSelection()
  let range = document.createRange()
  range.selectNodeContents(el)
  selection.removeAllRanges()
  selection.addRange(range)
}

App.is_image = (file) => {
  return file.type.match(`image/*`)
}

App.is_audio = (file) => {
  return file.type.match(`audio/*`)
}

App.is_video = (file) => {
  return file.type.match(`video/*`)
}

App.set_css_var = (name, value) => {
  document.documentElement.style.setProperty(`--${name}`, value)
}

App.print_info = (msg) => {
  // eslint-disable-next-line no-console
  console.log(msg)
}

App.print_error = (msg) => {
  // eslint-disable-next-line no-console
  console.log(`Error: ${msg}`)
}

App.contains_url = (text) => {
  return text.match(/(https?:\/\/|www\.)\S+/gi)
}

App.prompt_text = (args = {}) => {
  new Promptext(args)
}

App.popmsg = (message, callback) => {
  new Popmsg(message, callback)
}

App.remove_multiple_empty_lines = (s) => {
  return s.replace(/\n\s*\n/g, `\n\n`)
}

App.capitalize = (s) => {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

App.setup_menu_opts = (show_return = true, show = false) => {
  let name = `menu`

  App.make_opts(name, () => {
    if (!show_return) {
      DOM.el(`#${name}_opts_return`).remove()
    }

    App.bind_button(`${name}_opts_fresh`, () => {
      App.location(`/fresh`)
    }, () => {
      App.open_tab(`/fresh`)
    })

    App.bind_button(`${name}_opts_random`, () => {
      App.location(`/random`)
    }, () => {
      App.open_tab(`/random`)
    })

    App.bind_button(`${name}_opts_return`, () => {
      App.location(`/`)
    }, () => {
      App.open_tab(`/`)
    })

    App.bind_button(`${name}_opts_you`, () => {
      App.setup_you_opts(App.user_id, true, true)
    })

    App.bind_button(`${name}_opts_list`, () => {
      App.setup_list_opts(true, true)
    })

    App.bind_button(`${name}_opts_admin`, () => {
      App.setup_admin_opts(true, true)
    })

    App.bind_button(`${name}_opts_links`, () => {
      App.setup_link_opts(true, true)
    })
  }, show)
}

App.setup_you_opts = (user_id, show = false, back = false) => {
  let name = `you`

  App.make_opts(name, () => {
    App.bind_button(`${name}_opts_posts`, () => {
      App.location(`/list/posts?user_id=${user_id}`)
    })

    App.bind_button(`${name}_opts_reactions`, () => {
      App.location(`/list/reactions?user_id=${user_id}`)
    })

    App.bind_button(`${name}_opts_edit_name`, () => {
      App.edit_name()
    })

    App.bind_button(`${name}_opts_edit_password`, () => {
      App.edit_password()
    })

    App.bind_button(`${name}_opts_logout`, () => {
      let confirm_args = {
        message: `Visne profecto discedere ?`,
        callback_yes: () => {
          App.location(`/logout`)
        },
      }

      App.confirmbox(confirm_args)
    })
  }, show, back)
}

App.setup_user_opts = (show = false, back = false) => {
  let name = `user`

  App.make_opts(name, () => {
    App.bind_button(`${name}_opts_posts`, () => {
      let user_id = App.user_opts_user_id

      if (App.mode.includes(`admin`)) {
        App.location(`/admin/posts?user_id=${user_id}`)
      }
      else {
        App.location(`/list/posts?user_id=${user_id}`)
      }
    }, () => {
      let user_id = App.user_opts_user_id

      if (App.mode.includes(`admin`)) {
        App.open_tab(`/admin/posts?user_id=${user_id}`)
      }
      else {
        App.open_tab(`/list/posts?user_id=${user_id}`)
      }
    })

    App.bind_button(`${name}_opts_reactions`, () => {
      let user_id = App.user_opts_user_id

      if (App.mode.includes(`admin`)) {
        App.location(`/admin/reactions?user_id=${user_id}`)
      }
      else {
        App.location(`/list/reactions?user_id=${user_id}`)
      }
    }, () => {
      let user_id = App.user_opts_user_id

      if (App.mode.includes(`admin`)) {
        App.open_tab(`/admin/reactions?user_id=${user_id}`)
      }
      else {
        App.open_tab(`/list/reactions?user_id=${user_id}`)
      }
    })

    App.bind_button(`${name}_opts_user`, () => {
      let user_id = App.user_opts_user_id
      App.location(`/edit_user/${user_id}`)
    }, () => {
      let user_id = App.user_opts_user_id
      App.open_tab(`/edit_user/${user_id}`)
    })
  }, show, back)
}

App.fill_def_args = (def, args) => {
  for (let key in def) {
    if ((args[key] === undefined) && (def[key] !== undefined)) {
      args[key] = def[key]
    }
  }
}

App.confirmbox = (args = {}) => {
  new Confirmbox(args)
}

App.setup_reaction_opts = (show = false) => {
  let name = `reaction`

  App.make_opts(name, () => {
    App.bind_button(`${name}_opts_edit`, () => {
      let id = App.active_item.dataset.id
      App.react_prompt(id)
    })

    App.bind_button(`${name}_opts_delete`, () => {
      let id = App.active_item.dataset.id
      App.delete_reaction(id)
    })
  }, show)
}

App.regex_u = (c, n) => {
  return `${c}{${n}}`
}

App.regex_t = (c, n) => {
  let u = App.regex_u(c, n)
  return `(?:(?!${u}|\\s).)`
}

App.regex_t2 = (c, n) => {
  let u = App.regex_u(c, n)
  return `(?:(?!${u}).)`
}

App.char_regex_1 = (char, n = 1) => {
  let c = App.escape_regex(char)
  let u = App.regex_u(c, n)
  let t = App.regex_t(c, n)
  let t2 = App.regex_t2(c, n)
  let regex = `${u}(${t}${t2}*${t}|${t})${u}`
  return new RegExp(regex, `g`)
}

App.char_regex_2 = (char, n = 1) => {
  let c = App.escape_regex(char)
  let u = App.regex_u(c, n)
  let t = App.regex_t(c, n)
  let regex = `(?:^|\\s)${u}(${t}.*?${t}|${t})${u}(?:$|\\s)`
  return new RegExp(regex, `g`)
}

App.char_regex_3 = (char, n = 1) => {
  let c = App.escape_regex(char)
  let u = App.regex_u(c, n)
  let t2 = App.regex_t2(c, n)
  let regex = `${u}(${t2}+)${u}`
  return new RegExp(regex, `g`)
}

App.to_bold = (text) => {
  return `<span class='md_highlight'>${text}</span>`
}

App.parse_markdown = (text) => {
  function action(regex, func, full = false) {
    let matches = [...text.matchAll(regex)]

    for (let match of matches) {
      if (full) {
        text = text.replace(match[0], func(match[0]))
      }
      else {
        text = text.replace(match[0], func(match[1]))
      }
    }
  }

  action(App.char_regex_3(`\``), App.to_bold)
  action(App.char_regex_3(`"`), App.to_bold, true)
  action(App.char_regex_1(`*`, 2), App.to_bold)
  action(App.char_regex_1(`*`), App.to_bold)
  action(App.char_regex_2(`_`, 2), App.to_bold)
  action(App.char_regex_2(`_`), App.to_bold)
  return text
}

App.escape_regex = (s) => {
  return s.replace(/[^A-Za-z0-9]/g, `\\$&`)
}

App.create_debouncer = (func, delay) => {
  if (typeof func !== `function`) {
    App.print_error(`Invalid debouncer function`)
    return
  }

  if ((typeof delay !== `number`) || (delay < 1)) {
    App.print_error(`Invalid debouncer delay`)
    return
  }

  let timer
  let obj = {}

  function clear() {
    clearTimeout(timer)
    timer = undefined
  }

  function run(...args) {
    func(...args)
  }

  obj.call = (...args) => {
    clear()

    timer = setTimeout(() => {
      run(...args)
    }, delay)
  }

  obj.call_2 = (...args) => {
    if (timer) {
      return
    }

    obj.call(args)
  }

  obj.now = (...args) => {
    clear()
    run(...args)
  }

  obj.cancel = () => {
    clear()
  }

  return obj
}

App.replace_urls = (text) => {
  let here = window.location.origin
  let re = new RegExp(`${here}/post/([0-9A-Za-z]+)/?$`, `g`)
  text = text.replace(re, `/post/$1`)
  re = /https?:\/\/([a-z]{2,3})\.wikipedia\.org\/wiki\/([0-9A-Za-z_()#-]+)\/?$/g
  text = text.replace(re, `/wiki/$2`)
  re = /https?:\/\/www\.youtube\.com\/watch\?v=([0-9A-Za-z_-]+)\/?$/g
  text = text.replace(re, `/yt/$1`)
  re = /https?:\/\/youtu\.be\/([0-9A-Za-z_-]+)\/?$/g
  text = text.replace(re, `/yt/$1`)
  re = /https?:\/\/github\.com\/([0-9A-Za-z_-]+)\/([0-9A-Za-z_-]+)\/?$/g
  return text.replace(re, `/github/$1/$2`)
}

App.text_html = (text, markdown = true) => {
  // Remove < and > to prevent XSS
  text = text.replace(/</g, `&lt;`)
  text = text.replace(/>/g, `&gt;`)

  // Markdown
  if (markdown) {
    text = App.parse_markdown(text)
  }

  // Internal posts
  let re = new RegExp(`/post/([0-9A-Za-z]+)`, `gi`)
  text = text.replace(re, `<a href="/post/$1">Post: $1</a>`)

  // Wikipedia
  re = /\/wiki\/([0-9A-Za-z_()-]+)(#[0-9A-Za-z_()-]+)?\/?/gi

  text = text.replace(re, (match, g1, g2) => {
    let u = g1
    let s = decodeURIComponent(g1)

    if (g2) {
      u += g2
      s += decodeURIComponent(g2)
    }

    return `<a href="https://wikipedia.org/wiki/${u}">Wiki: ${s}</a>`
  })

  // YouTube
  re = /\/yt\/([0-9A-Za-z_-]+)\/?/gi
  text = text.replace(re, `<a href="https://www.youtube.com/watch?v=$1">YT: $1</a>`)

  // GitHub
  re = /\/github\/([0-9A-Za-z_-]+)\/([0-9A-Za-z_-]+)\/?/gi
  text = text.replace(re, `<a href="https://github.com/$1/$2">GH: $1/$2</a>`)

  // :image_names:
  re = /:(\w+):/gi
  text = text.replace(re, `<img src="/static/icons/$1.gif" class="reaction_icon" title="$1">`)

  return text
}

App.user_mod_input = (what, o_value, vtype, callback) => {
  let repeat = false

  if (vtype === `password`) {
    repeat = true
  }

  function send(value) {
    if (vtype === `password`) {
      vtype = `string`
    }

    if (vtype === `number`) {
      value = parseInt(value)

      if (isNaN(value)) {
        value = 0
      }
    }

    if (o_value && (value === o_value)) {
      return
    }

    if (callback) {
      callback(what, value, vtype)
    }
    else {
      App.mod_user(what, value, vtype)
    }
  }

  let prompt_args = {
    value: o_value,
    placeholder: `Type the new ${what}`,
    max: App.text_reaction_length,
    password: vtype === `password`,
    callback: (value_1) => {
      if (!repeat) {
        send(value_1)
        return
      }

      let prompt_args_2 = {
        placeholder: `Enter the value again`,
        max: App.text_reaction_length,
        password: vtype === `password`,
        callback: (value_2) => {
          if (value_1 !== value_2) {
            App.popmsg(`Values don't match`)
            return
          }

          send(value_2)
        },
      }

      App.prompt_text(prompt_args_2)
    },
  }

  App.prompt_text(prompt_args)
}

App.edit_name = () => {
  App.user_mod_input(`name`, App.user_name, `string`, (what, value, vtype) => {
    App.do_user_edit(what, value, vtype, `Name`, () => {
      App.user_name = value
      DOM.el(`#user_name`).textContent = value
    })
  })
}

App.edit_password = () => {
  App.user_mod_input(`password`, ``, `password`, (what, value, vtype) => {
    App.do_user_edit(what, value, vtype, `Password`)
  })
}

App.do_user_edit = async (what, value, vtype, title, callback) => {
  let ids = [App.user_id]

  let response = await fetch(`/mod_user`, {
    method: `POST`,
    headers: {
      "Content-Type": `application/json`,
    },
    body: JSON.stringify({ids, what, value, vtype}),
  })

  if (response.ok) {
    App.popmsg(`${title} updated`, () => {
      if (callback) {
        callback()
      }
    })
  }
  else {
    App.print_error(response.status)
  }
}

App.setup_list_opts = (show = false, back = false) => {
  let name = `list`

  App.make_opts(name, () => {
    App.bind_button(`${name}_opts_posts`, () => {
      App.location(`/list/posts`)
    }, () => {
      App.open_tab(`/list/posts`)
    })

    App.bind_button(`${name}_opts_reactions`, () => {
      App.location(`/list/reactions`)
    }, () => {
      App.open_tab(`/list/reactions`)
    })
  }, show, back)
}

App.setup_admin_opts = (show = false, back = false) => {
  let name = `admin`

  App.make_opts(name, () => {
    App.bind_button(`${name}_opts_posts`, () => {
      App.location(`/admin/posts`)
    }, () => {
      App.open_tab(`/admin/posts`)
    })

    App.bind_button(`${name}_opts_reactions`, () => {
      App.location(`/admin/reactions`)
    }, () => {
      App.open_tab(`/admin/reactions`)
    })

    App.bind_button(`${name}_opts_users`, () => {
      App.location(`/admin/users`)
    }, () => {
      App.open_tab(`/admin/users`)
    })
  }, show, back)
}

App.setup_link_opts = (show = false, back = false) => {
  let name = `link`

  App.make_opts(name, () => {
    let c = DOM.el(`#links_container`)

    for (let [i, link] of App.links.entries()) {
      let item = DOM.create(`div`, `aero_button`, `${name}_opts_${i}`)
      item.textContent = link.name
      item.title = link.url
      c.appendChild(item)

      App.bind_button(`${name}_opts_${i}`, () => {
        App.open_tab(link.url, link.target)
      }, () => {
        App.open_tab(link.url)
      })
    }
  }, show, back)
}

App.make_opts = (name, setup, show = false, back = false) => {
  let msg_name = `msg_${name}`

  if (App[msg_name]) {
    if (show) {
      App[msg_name].show()
    }

    return
  }

  App[msg_name] = Msg.factory({
    after_show: () => {
      let selection = window.getSelection()
      selection.removeAllRanges()
    },
  })

  let t = DOM.el(`#template_${name}_opts`)
  App[msg_name].set(t.innerHTML)
  setup()

  if (back && App.msg_menu) {
    let c = DOM.el(`.dialog_container`, App[msg_name].content)
    let btn = DOM.create(`div`, `aero_button`, `${name}_opts_back`)
    btn.textContent = `Back`
    c.appendChild(btn)

    App.bind_button(`${name}_opts_back`, () => {
      App.msg_show(`menu`)
    })
  }

  if (show) {
    App[msg_name].show()
  }
}

App.bind_button = (what, func, mfunc) => {
  let name = what.split(`_`)[0]
  let msg_name = `msg_${name}`
  let el = DOM.el(`#${what}`)

  if (!el) {
    return
  }

  let c = DOM.el(`.dialog_container`, App[msg_name].content)
  let btns = DOM.els(`.aero_button`, c)
  let index = btns.indexOf(el)
  el.textContent = `${index + 1}. ${el.textContent}`

  if (func) {
    DOM.ev(el, `click`, (e) => {
      App[msg_name].close()
      func()
    })
  }

  if (mfunc || func) {
    DOM.ev(el, `auxclick`, (e) => {
      if (e.button === 1) {
        App[msg_name].close()

        if (mfunc) {
          mfunc()
        }
        else if (func) {
          func()
        }
      }
    })
  }

  DOM.ev(el, `contextmenu`, (e) => {
    App[msg_name].close()
    e.preventDefault()

    if (func) {
      func()
    }
  })
}

App.open_tab = (url, target = `_blank`) => {
  window.open(url, target)
}

App.encode_uri = (uri) => {
  return encodeURIComponent(uri)
}

App.setup_editpost_opts = (show = false) => {
  let name = `editpost`

  App.make_opts(name, () => {
    App.bind_button(`${name}_opts_title`, () => {
      App.edit_title()
    })

    App.bind_button(`${name}_opts_delete`, () => {
      let confirm_args = {
        message: `Delete this post ?`,
        callback_yes: () => {
          App.delete_post()
        },
      }

      App.confirmbox(confirm_args)
    })
  }, show)
}

App.next_post = () => {
  if (App.name) {
    App.location(`/next/${App.name}`)
  }
  else {
    App.location(`/random`)
  }
}

App.fresh_post = () => {
  App.location(`/fresh`)
}

App.random_post = () => {
  App.location(`/random`)
}

App.msg_show = (what) => {
  let msg = App[`msg_${what}`]

  if (msg) {
    msg.show()
  }
}

App.location = (where) => {
  window.location = where
}

App.close_all_modals = () => {
  Msg.msg.close_all()
}

App.timeago = (date) => {
  let level = 0
  let diff = Date.now() - date
  let places = 1
  let result

  if (diff < App.MINUTE) {
    result = `just now`
    level = 1
  }
  else if (diff < App.HOUR) {
    let n = parseFloat((diff / App.MINUTE).toFixed(places))

    if (n === 1) {
      result = `${n} min ago`
    }
    else {
      result = `${n} mins ago`
    }

    level = 2
  }
  else if ((diff >= App.HOUR) && (diff < App.DAY)) {
    let n = parseFloat(diff / App.HOUR).toFixed(places)

    if (n === 1) {
      result = `${n} hr ago`
    }
    else {
      result = `${n} hrs ago`
    }

    level = 3
  }
  else if ((diff >= App.DAY) && (diff < App.MONTH)) {
    let n = parseFloat(diff / App.DAY).toFixed(places)

    if (n === 1) {
      result = `${n} day ago`
    }
    else {
      result = `${n} days ago`
    }

    level = 4
  }
  else if ((diff >= App.MONTH) && (diff < App.YEAR)) {
    let n = parseFloat(diff / App.MONTH).toFixed(places)

    if (n === 1) {
      result = `${n} month ago`
    }
    else {
      result = `${n} months ago`
    }

    level = 5
  }
  else if (diff >= App.YEAR) {
    let n = parseFloat(diff / App.YEAR).toFixed(places)

    if (n === 1) {
      result = `${n} year ago`
    }
    else {
      result = `${n} years ago`
    }

    level = 6
  }

  return [result, level]
}