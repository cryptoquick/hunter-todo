'use strict'

const { render, h } = preact

// Functional Logger
const log = (item) => {
  console.log(item)
  return item
}

// Constants
const textColor = 'whitesmoke'
const primaryColor = 'mediumvioletred'
const highlightColor = 'blueviolet'

// Components

// Checkboxes
const CheckboxProps = (state, onClick, onContextMenu) => ({
  style: {
    width: '30px',
    height: '30px',
    fontSize: '30px',
    border: `1px ${primaryColor}`,
    cursor: 'pointer',
    userSelect: 'none',
  },
  className: 'checkbox',
  onClick,
  onContextMenu,
})

const checkboxStates = ['😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']

const Checkbox = ({
  state,
  id,
}) => h('span', CheckboxProps(state, clickCheckItem(id, state + 1), clickCheckItem(id, state - 1)),
  checkboxStates[state]
) // >:3

// Items
const FormProps = (onKeypress) => ({
  style: {
    display: 'inline',
  },
  onKeypress,
})

const InputProps = (id, onKeypress, onBlur, name, value, fontSize) => ({
  style: {
    border: 'none',
    backgroundColor: highlightColor,
    outline: 'none',
    fontSize,
  },
  id,
  onKeypress,
  onBlur: (event) => {
    onKeypress(event)
    onBlur(event)
  },
  name,
  value,
})

const ItemProps = (editing, onClick, onContextMenu) => ({
  style: {
    userSelect: 'none',
    backgroundColor: editing ? highlightColor : 'transparent',
    marginLeft: '20px',
  },
  onClick,
  onContextMenu,
})

const Item = ({
  id,
  description,
  state,
  editingId,
}) => h('li', ItemProps(editingId === id, editItem(id), clickRemoveItem(id)),
  Checkbox({ state, id }),
  editingId === id ? h('form', FormProps(keypressItemDescription(id)),
    h('input', InputProps(id, keypressItemDescription(id), clearEdit, 'description', description, '16px'))
  ) : description)

// Lists
const ListHeaderProps = (editing, onClick, onContextMenu) => ({
  style: {
    fontSize: '24px',
    userSelect: 'none',
    backgroundColor: editing ? highlightColor : 'transparent'
  },
  onClick,
  onContextMenu,
})

const AddButtonProps = (onClick) => ({
  style: {
    border: 'none',
    borderRadius: '25px',
    padding: '10px 15px',
    lineHeight: '30px',
    color: textColor,
    backgroundColor: primaryColor,
  },
  onClick,
})

const ListProps = {
  style: {
    listStyle: 'none',
  },
}

const ListEdit = ({
  items,
  list,
  editingId,
}) => list ? h('div', { style: { marginLeft: '20px' } },
  h('h2', ListHeaderProps(editingId === list.listId, editItem(list.listId), clickRemoveList(list.listId)),
  editingId === list.listId ? h('form', FormProps(keypressListName(list.listId)),
      h('input', InputProps(list.listId, keypressListName(list.listId), clearEdit, 'title', list.title, '24px'))
    ) : list.title
  ),
  h('button', AddButtonProps(clickAddNewItem(list.listId, items.length)), 'mew 😺'),
  h('ul', ListProps,
    ...items.map((item) => {
      item.editingId = editingId // Item({...item, editingId}) // Not supported on Chrome yet, ES7
      return Item(item)
    })
  )
) : h('p', {}, 'select a different list pls')

const ListsItemProps = (listId, selectedListId) => ({
  style: {
    fontWeight: listId === selectedListId ? 'bold' : 'normal',
    marginLeft: '20px',
  },
  onClick: clickSelectList(listId),
})

const Lists = ({
  lists,
  selectedListId,
}) => h('div', { style: { marginLeft: '20px' } },
  h('h3', {}, 'your 📝s:'),
  h('ul', ListProps,
    ...lists
      .sort((a, b) => a.order - b.order)
      .map((list) => h('li', ListsItemProps(list.listId, selectedListId), list.title)),
    h('li', {}, h('button', AddButtonProps(clickAddNewList(lists.length)), 'mew 📝'))
  )
)

// Application Component
const App = ({
  items,
  lists,
  selectedListId,
  editingId,
}) => h('div', {},
  h('h1', { style: { fontSize: '36px', backgroundColor: primaryColor, color: textColor } }, 'hunter todo 😼'),
  Lists({
    lists,
    selectedListId,
  }),
  lists.length ? ListEdit({
    items: items
      .filter(({ listId }) => listId === selectedListId)
      .sort((a, b) => a.order - b.order),
    list: lists.find(({ listId }) => listId === selectedListId),
    editingId,
  }) : h('p', { style: { marginLeft: '20px' } }, 'make a list!')
)

// Event Handlers
const clickAddNewItem = (listId, length) => (event) => store.dispatch(addNewItem(listId, length, `item ${length + 1}`))
const clickRemoveItem = (id) => (event) => {
  if (event.target.getAttribute('class') !== 'checkbox') {
    event.preventDefault()
    store.dispatch(removeItem(id))
  }
  return false
}
const clickCheckItem = (id, state) => (event) => {
  event.preventDefault()
  store.dispatch(updateItem(id, 'state', (state + checkboxStates.length) % checkboxStates.length))
  return false
}
const keypressItemDescription = (id) => (event) => {
  if (event.which === 13) {
    event.preventDefault()
    store.dispatch(clearEditing())
  }
  else {
    store.dispatch(updateItem(id, 'description', event.target.form.description.value))
  }
}
const keypressListName = (id) => (event) => {
  if (event.which === 13) {
    event.preventDefault()
    store.dispatch(clearEditing())
  }
  else {
    store.dispatch(renameList(id, event.target.form.title.value))
  }
}
const clickAddNewList = (length) => (event) => store.dispatch(addNewList(length, `list ${length + 1}`))
const clickRemoveList = (listId) => (event) => {
  event.preventDefault()
  store.dispatch(removeList(listId))
  return false
}
const clickSelectList = (listId) => (event) => store.dispatch(selectList(listId))
const editItem = (id) => (event) => {
  if (event.target.getAttribute('class') !== 'checkbox') {
    store.dispatch(setEditing(id))
    const el = document.getElementById(id)
    el.focus()
    el.select()
  }
}
const clearEdit = (event) => store.dispatch(clearEditing())

// Actions
const addNewItem = (listId, order = 0, description = '', state = 0) => ({
  type: 'ADD_NEW_ITEM',
  item: {
    id: cuid(),
    listId,
    order,
    description,
    state,
  },
})

const removeItem = (id) => ({
  type: 'REMOVE_ITEM_BY_ID',
  id,
})

const updateItems = (listId, field, value) => ({
  type: 'UPDATE_ITEMS_BY_LIST_ID',
  listId,
  field,
  value,
})

const updateItem = (id, field, value) => ({
  type: 'UPDATE_ITEM_BY_ID',
  id,
  field,
  value,
})

const addNewList = (order = 0, title = '') => ({
  type: 'ADD_NEW_LIST',
  list: {
    listId: cuid(),
    order,
    title,
  },
})

const removeList = (listId) => ({
  type: 'REMOVE_LIST_BY_ID',
  listId,
})

const renameList = (listId, title) => ({
  type: 'RENAME_LIST_BY_ID',
  listId,
  title,
})

const selectList = (listId) => ({
  type: 'SELECT_LIST',
  listId,
})

const setEditing = (id) => ({
  type: 'SET_EDITING',
  id,
})

const clearEditing = () => ({
  type: 'CLEAR_EDITING',
})

// Reducers
const items = (state = [], action) => {
  switch (action.type) {
    case 'ADD_NEW_ITEM':
      return [...state, action.item]
    case 'REMOVE_ITEM_BY_ID':
      return state.filter(({ id }) => id !== action.id)
    case 'UPDATE_ITEMS_BY_LIST_ID':
      return state.map((item) => {
        item[action.field] = item.listId === action.listId ? action.value : item[action.field]
        return item
      })
    case 'UPDATE_ITEM_BY_ID':
      return state.map((item) => {
        item[action.field] = item.id === action.id ? action.value : item[action.field]
        return item
      })
    case 'REMOVE_LIST_BY_ID':
      return state.filter(({ listId }) => listId !== action.listId)
  }
  return state
}

const lists = (state = [], action) => {
  switch (action.type) {
    case 'ADD_NEW_LIST':
      return [...state, action.list]
    case 'REMOVE_LIST_BY_ID':
      return state.filter(({ listId }) => listId !== action.listId)
    case 'RENAME_LIST_BY_ID':
      return state.map((list) => {
        list.title = list.listId === action.listId ? action.title : list.title
        return list
      })
  }
  return state
}

const selectedListId = (state = null, action) => {
  switch (action.type) {
    case 'ADD_NEW_LIST':
      return action.list.listId
    case 'SELECT_LIST':
      return action.listId
  }
  return state
}

const editingId = (state = null, action) => {
  switch (action.type) {
    case 'SET_EDITING':
      return action.id
    case 'CLEAR_EDITING':
      return null
  }
  return state
}

// State Management & Rendering
const { createStore, combineReducers } = Redux
const { persistStore, autoRehydrate } = window['redux-persist']

const reducer = combineReducers({
  items,
  lists,
  selectedListId,
  editingId,
})

const store = createStore(reducer, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(), autoRehydrate())
persistStore(store)

let parent
const renderApp = () => render(
  App(store.getState()),
  document.body,
  parent
)

store.subscribe(renderApp)
parent = renderApp()
