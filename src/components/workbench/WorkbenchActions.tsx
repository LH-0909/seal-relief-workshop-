import { useEditor } from '../../store/editorStore'
import ExportButton from './ExportButton'

export default function WorkbenchActions() {
  const { dispatch } = useEditor()

  const handleReset = () => {
    dispatch({ type: 'CLEAR_IMAGE' })
    dispatch({ type: 'RESET_PARAMS' })
  }

  return (
    <>
      <button className="btn-ghost" type="button">帮助</button>
      <button className="btn-secondary" type="button" onClick={handleReset}>重置</button>
      <ExportButton label="导出" />
    </>
  )
}
