window.onload = () => {
  let uname = DOM.el(`#username`)

  if (uname) {
    uname.focus()
  }

  let del = DOM.el(`#delete`)

  if (del) {
    DOM.ev(del, `click`, () => {
      if (confirm(`Delete ${vars.username} ?`)) {
        delete_user()
      }
    })
  }

  DOM.ev(document, `click`, (e) => {
    if (e.target.closest(`.checkbox`)) {
      let c = e.target.closest(`.checkbox`)
      let cb = DOM.el(`input[type="checkbox"]`, c)

      if (cb) {
        cb.checked = !cb.checked
      }
    }
  })
}

async function delete_user() {
  let username = vars.username

  if (!username) {
    return
  }

  try {
    let response = await fetch(`/delete_user`, {
      method: `POST`,
      headers: {
        "Content-Type": `application/json`,
      },
      body: JSON.stringify({username}),
    })

    if (response.ok) {
      alert(`Deleted`)
    }
    else {
      print_error(response.status)
    }
  }
  catch (error) {
    print_error(error)
  }
}

function print_error(msg) {
  // eslint-disable-next-line no-console
  console.log(`Error: ${msg}`)
}