// import { writable, derived } from "svelte/store";

// export const userAccountState = {
//   accounts: writable([]),
//   selectedAccountId: writable(null),
//   // ...other state
// };

// export const selectedAccountUsername = derived(
//   [userAccountState.accounts, userAccountState.selectedAccountId],
//   ([$accounts, $selectedAccountId]) => {
//     const acc = $accounts.find(a => a.id === $selectedAccountId);
//     return acc ? acc.username : "";
//   }
// );

// export const selectedAccount = writable(
//     localStorage.getItem('selectedAccount') || null
// );

// // Keep localStorage in sync
// selectedAccount.subscribe(val => {
//     if (val) {
//         localStorage.setItem('selectedAccount', val);
//     } else {
//         localStorage.removeItem('selectedAccount');
//     }
// });