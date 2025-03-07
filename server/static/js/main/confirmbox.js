class Confirmbox {
  static instance = null

  constructor(args = {}) {
    let def_args = {
      message: `Are you sure ?`,
      yes: `Yes`,
      no: `No`,
    }

    App.fill_def_args(def_args, args)

    let msg = Msg.factory({
      persistent: false,
      after_close: () => {
        Confirmbox.instance = null
      },
    })

    let c = DOM.create(`div`)
    c.id = `confirmbox_container`
    let m = DOM.create(`div`)
    m.id = `confirmbox_message`
    m.textContent = args.message
    let btns = DOM.create(`div`, `dialog_container`)
    btns.id = `confirmbox_buttons`
    let n = DOM.create(`div`, `aero_button`)
    n.textContent = `1. ${args.no}`
    let y = DOM.create(`div`, `aero_button`)
    y.textContent = `2. ${args.yes}`
    c.appendChild(m)
    btns.appendChild(n)
    btns.appendChild(y)
    c.appendChild(btns)
    msg.set(c)

    DOM.ev(y, `click`, (e) => {
      this.action()
    })

    DOM.ev(n, `click`, (e) => {
      if (args.callback_no) {
        args.callback_no()
      }

      msg.close()
    })

    this.args = args
    this.msg = msg
    Confirmbox.instance = this
    msg.show()
  }

  action() {
    if (this.args.callback_yes) {
      this.args.callback_yes()
    }

    this.msg.close()
  }
}