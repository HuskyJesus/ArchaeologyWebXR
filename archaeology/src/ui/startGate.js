/* Start-gate action routing, isolated from the DOM so the exact contract can be
   unit-tested.

   The one piece of state is `pending`: the start action (3D or guided) waiting
   on the "discard the existing save?" confirmation. The rules are deliberately
   strict, because the failure this guards against is a shared/deferred action
   that the wrong button later executes:

     - Only requestStart() ever sets `pending`.
     - Only confirm() ever runs it, and it runs at most once.
     - dismiss() (Cancel, Escape, or the dialog closing for any reason) clears it
       without running anything.
     - resume() and openSettings() never read `pending`, so neither can inherit
       a start button's queued action. openSettings() is never blocked by a save.

   `effects` are the real side effects, injected so tests can substitute spies:
     hasSave()        -> boolean
     startInMode(mode)-> begin a fresh investigation in '3d' | 'guided'
     resume()         -> resume the saved investigation
     openSettings()   -> open the settings/accessibility panel
     openConfirm()    -> show the discard-confirmation dialog
     closeConfirm()   -> hide the discard-confirmation dialog
*/
export function createGateController(effects) {
  let pending = null;

  return {
    /* A start button was pressed. With no save, start immediately. With a save,
       remember exactly what was asked for and open the confirmation. */
    requestStart(mode) {
      if (effects.hasSave()) {
        pending = { mode };
        effects.openConfirm();
        return;
      }
      effects.startInMode(mode);
    },

    /* Resume performs only its own action and never touches `pending`. */
    resume() {
      effects.resume();
    },

    /* Settings opens immediately, regardless of any save, and never sets or
       reads `pending`. */
    openSettings() {
      effects.openSettings();
    },

    /* The learner confirmed the discard. Capture and clear `pending` first so
       the action fires exactly once and nothing can execute it again. */
    confirm() {
      const action = pending;
      pending = null;
      effects.closeConfirm();
      if (action) effects.startInMode(action.mode);
    },

    /* Any non-confirming close of the dialog: forget the requested action. */
    dismiss() {
      pending = null;
    },

    /* Test/inspection helper. */
    get pending() {
      return pending;
    }
  };
}
