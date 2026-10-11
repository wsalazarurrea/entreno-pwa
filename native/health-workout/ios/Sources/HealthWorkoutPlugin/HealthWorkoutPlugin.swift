import Foundation
import Capacitor
import HealthKit

/// Guarda entrenamientos de fuerza en Apple Salud para que aparezcan en Salud y en Fitness.
/// JS: HealthWorkout.isAvailable() · requestAuthorization() · saveWorkout({ start, end, energyKcal?, id? })
/// (start/end en milisegundos desde 1970, como Date.now()).
@objc(HealthWorkoutPlugin)
public class HealthWorkoutPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HealthWorkoutPlugin"
    public let jsName = "HealthWorkout"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveWorkout", returnType: CAPPluginReturnPromise)
    ]

    private let store = HKHealthStore()

    private var shareTypes: Set<HKSampleType> {
        var types: Set<HKSampleType> = [HKObjectType.workoutType()]
        if let energy = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) { types.insert(energy) }
        return types
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": HKHealthStore.isHealthDataAvailable()])
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("Salud no está disponible en este dispositivo")
            return
        }
        store.requestAuthorization(toShare: shareTypes, read: nil) { _, error in
            if let error = error {
                call.reject(error.localizedDescription)
                return
            }
            let status = self.store.authorizationStatus(for: HKObjectType.workoutType())
            call.resolve(["workouts": status == .sharingAuthorized])
        }
    }

    @objc func saveWorkout(_ call: CAPPluginCall) {
        guard let startMs = call.getDouble("start"), let endMs = call.getDouble("end"), endMs > startMs else {
            call.reject("Fechas de inicio/fin inválidas")
            return
        }
        let start = Date(timeIntervalSince1970: startMs / 1000)
        let end = Date(timeIntervalSince1970: endMs / 1000)

        let config = HKWorkoutConfiguration()
        config.activityType = .traditionalStrengthTraining
        config.locationType = .indoor
        let builder = HKWorkoutBuilder(healthStore: store, configuration: config, device: .local())

        builder.beginCollection(withStart: start) { ok, error in
            guard ok else {
                call.reject(error?.localizedDescription ?? "No se pudo iniciar el registro en Salud")
                return
            }
            var samples: [HKSample] = []
            if let kcal = call.getDouble("energyKcal"), kcal > 0,
               let type = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) {
                samples.append(HKQuantitySample(type: type, quantity: HKQuantity(unit: .kilocalorie(), doubleValue: kcal), start: start, end: end))
            }
            var metadata: [String: Any] = [HKMetadataKeyIndoorWorkout: true]
            if let id = call.getString("id") { metadata[HKMetadataKeyExternalUUID] = id }

            let finish = {
                builder.addMetadata(metadata) { _, _ in
                    builder.endCollection(withEnd: end) { ok, error in
                        guard ok else {
                            call.reject(error?.localizedDescription ?? "No se pudo cerrar el registro en Salud")
                            return
                        }
                        builder.finishWorkout { workout, error in
                            if let error = error {
                                call.reject(error.localizedDescription)
                                return
                            }
                            call.resolve(["uuid": workout?.uuid.uuidString ?? ""])
                        }
                    }
                }
            }
            if samples.isEmpty {
                finish()
            } else {
                builder.add(samples) { _, _ in finish() }
            }
        }
    }
}
